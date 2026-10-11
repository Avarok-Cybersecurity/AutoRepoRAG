// SPDX-License-Identifier: Apache-2.0
// Multi-corpus retrieval (src/core/rag.js) over fake ports: what is searched,
// how candidates merge, what the reranker sees, and what gets cited.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { askCorpora, mergeCandidates, pickReranked } from '../../src/core/rag.js';

const CORPORA = [
  { id: 'code', collection: 'code', repo: 'org/engine', commit: 'a'.repeat(40) },
  { id: 'docs', collection: 'docs', repo: 'org/handbook', commit: 'b'.repeat(40) },
];

const hit = (id, score, text) => ({ id, score, payload: { text, path: `${text}.rs`, start_line: 1, end_line: 9, language: 'rust' } });

function ports({ hits, ranked, dim = 2 }) {
  const log = { searches: [], reranks: [], chats: [] };
  return {
    log,
    openrouter: {
      getEmbedding: async (text, key, model) => {
        log.embed = { text, key, model };
        return new Array(dim).fill(0.5);
      },
      rerank: async (query, docs, key, topN, model) => {
        log.reranks.push({ docs, topN, model });
        return ranked(docs);
      },
      chat: async (messages, system, key, opts) => {
        log.chats.push({ messages, system, opts });
        return 'answer';
      },
    },
    lattice: {
      search: (collection, vector, limit) => {
        log.searches.push({ collection, limit });
        return hits[collection] ?? [];
      },
    },
  };
}

const base = (p) => ({
  openrouter: p.openrouter,
  lattice: p.lattice,
  corpora: CORPORA,
  embedding: { model: 'embed/model', dim: 2 },
  retrieval: { topK: 2, rerankMultiplier: 2 },
  productName: 'Example',
  rerankModel: 'rerank/model',
  chatModel: 'chat/model',
  apiKey: 'k',
  onPhase() {},
  onDelta() {},
});

describe('mergeCandidates', () => {
  it('merges every corpus by cosine distance (lower is better) and cuts to the limit', () => {
    const merged = mergeCandidates(
      [
        { corpus: CORPORA[0], hits: [hit(1, 0.3, 'c1'), hit(2, 0.1, 'c2')] },
        { corpus: CORPORA[1], hits: [hit(1, 0.2, 'd1'), hit(2, 0.9, 'd2')] },
      ],
      3
    );
    assert.deepEqual(merged.map((c) => `${c.corpus.id}:${c.payload.text}`), ['code:c2', 'docs:d1', 'code:c1']);
  });

  it('drops hits without text instead of citing an empty chunk', () => {
    assert.equal(mergeCandidates([{ corpus: CORPORA[0], hits: [{ id: 1, score: 0, payload: {} }, { id: 2, score: 0 }] }], 5).length, 0);
  });
});

describe('pickReranked', () => {
  it('ignores indices the reranker invented (strings, out of range, fractions, null)', () => {
    const cands = ['x', 'y'];
    const ranked = [{ index: 'length' }, { index: 'map' }, { index: 1 }, { index: 5 }, { index: -1 }, { index: 0.5 }, { index: null }];
    assert.deepEqual(pickReranked(ranked, cands, 7), ['y']);
  });
});

describe('askCorpora', () => {
  it('searches each corpus with topK*rerankMultiplier, reranks ONCE, and cites both corpora', async () => {
    const p = ports({
      hits: { code: [hit(1, 0.4, 'code-a'), hit(2, 0.1, 'code-b')], docs: [hit(1, 0.2, 'docs-a'), hit(2, 0.8, 'docs-b')] },
      ranked: (docs) => [{ index: docs.indexOf('docs-a'), score: 0.9 }, { index: docs.indexOf('code-b'), score: 0.8 }],
    });
    const { sources } = await askCorpora('q', [], base(p));
    assert.deepEqual(p.log.searches, [
      { collection: 'code', limit: 4 },
      { collection: 'docs', limit: 4 },
    ]);
    assert.equal(p.log.reranks.length, 1);
    assert.deepEqual(p.log.reranks[0].docs, ['code-b', 'docs-a', 'code-a', 'docs-b']);
    assert.equal(p.log.reranks[0].topN, 2);
    assert.equal(p.log.reranks[0].model, 'rerank/model');
    assert.deepEqual(sources.map((s) => [s.n, s.corpusId, s.url]), [
      [1, 'docs', `https://github.com/org/handbook/blob/${'b'.repeat(40)}/docs-a.rs#L1-L9`],
      [2, 'code', `https://github.com/org/engine/blob/${'a'.repeat(40)}/code-b.rs#L1-L9`],
    ]);
  });

  it('embeds with the model the corpora were built with and answers with the chat model it is given', async () => {
    const p = ports({ hits: { code: [hit(1, 0.1, 'only')] }, ranked: () => [] });
    await askCorpora('where?', [{ role: 'user', content: 'before' }], base(p));
    assert.deepEqual(p.log.embed, { text: 'where?', key: 'k', model: 'embed/model' });
    assert.equal(p.log.reranks.length, 0, 'one candidate needs no rerank round-trip');
    const { messages, system, opts } = p.log.chats[0];
    assert.equal(opts.model, 'chat/model');
    assert.deepEqual(messages.at(-1), { role: 'user', content: 'where?' });
    assert.match(system, /the Example codebase \(GitHub repository org\/engine, commit a{40}; GitHub repository org\/handbook, commit b{40}\)/);
    assert.match(system, /\[1\] org\/engine only\.rs lines 1–9/);
  });

  it('refuses a question embedding whose dimension does not match the corpora', async () => {
    const p = ports({ hits: {}, ranked: () => [], dim: 3 });
    await assert.rejects(askCorpora('q', [], base(p)), /returned 3 dimensions but this corpus was built with 2/);
    assert.equal(p.log.searches.length, 0);
  });

  it('walks the phases retrieving -> reranking -> thinking', async () => {
    const phases = [];
    const p = ports({ hits: { code: [hit(1, 0.1, 'a'), hit(2, 0.2, 'b')] }, ranked: () => [{ index: 0 }] });
    await askCorpora('q', [], { ...base(p), onPhase: (ph) => phases.push(ph) });
    assert.deepEqual(phases, ['retrieving', 'reranking', 'thinking']);
  });
});
