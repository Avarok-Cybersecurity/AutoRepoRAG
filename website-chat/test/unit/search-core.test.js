// SPDX-License-Identifier: Apache-2.0
// Search mode's pure core: the snapshot manifest (src/core/search-meta.js),
// the per-corpus query plan, the query body, the router's answer, the
// cross-corpus fusion and the embedder guard (src/core/search.js).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateSearchMeta } from '../../src/core/search-meta.js';
import { checkedEmbed, fuseRanked, parseQueryResponse, planFor, queryBody } from '../../src/core/search.js';
import { SHA, rawMeta } from './search-fixture.js';

const HYBRID = { search_mode: 'hybrid', model: 'test/embed-8', dim: 8, vector_index: 'flat', vector_storage: 'f16' };
const VECTOR = { ...HYBRID, search_mode: 'vector', text_field: null };
const EMBEDDER = { model: 'test/embed-8', dim: 8, embed: async (texts) => texts.map(() => new Array(8).fill(0.5)) };

describe('validateSearchMeta', () => {
  it('returns the fields search mode reads, camelCased', () => {
    assert.deepEqual(validateSearchMeta(rawMeta(HYBRID), 'site'), {
      commitSha: SHA,
      repo: 'example-org/site',
      points: 12,
      files: 4,
      generatedAt: '2026-11-19T00:00:00Z',
      searchMode: 'hybrid',
      model: 'test/embed-8',
      dim: 8,
      snapshot: { bytes: 4096, sha256: 'b'.repeat(64), format: 2 },
    });
  });

  it('a corpus built without a snapshot validates, with snapshot null (the plan refuses it)', () => {
    const meta = validateSearchMeta(rawMeta({ snapshot_bytes: null, snapshot_sha256: null, snapshot_format: null }), 'site');
    assert.equal(meta.snapshot, null);
  });

  const broken = [
    [{ commit_sha: 7 }, /commit_sha/],
    [{ search_mode: 'semantic' }, /search_mode/],
    [{ search_mode: 'hybrid', model: null, dim: 8 }, /model/],
    [{ search_mode: 'vector', model: 'm', dim: 0 }, /dim/],
    [{ points: -1 }, /points/],
    [{ snapshot_bytes: 4096, snapshot_sha256: 'xyz', snapshot_format: 2 }, /snapshot_sha256/],
    [{ snapshot_bytes: null, snapshot_sha256: 'b'.repeat(64), snapshot_format: 2 }, /snapshot_/],
    [{ repo: 'no-slash' }, /repo/],
  ];
  for (const [over, why] of broken) {
    it(`refuses ${JSON.stringify(over)}`, () => {
      assert.throws(() => validateSearchMeta(rawMeta(over), 'site'), (e) => why.test(e.message) && e.message.includes('corpus "site"'));
    });
  }
  it('refuses a non-object', () => {
    assert.throws(() => validateSearchMeta([], 'site'), /not a JSON object/);
  });
});

describe('planFor', () => {
  const meta = (over) => validateSearchMeta(rawMeta(over), 'site');

  it('lexical is BM25 whatever the embedder', () => {
    assert.deepEqual(planFor(meta({}), null, 'site'), { kind: 'bm25', model: null });
    assert.deepEqual(planFor(meta({}), EMBEDDER, 'site'), { kind: 'bm25', model: null });
  });

  it('hybrid fuses BM25 and dense with an embedder, falls back to BM25 without one', () => {
    assert.deepEqual(planFor(meta(HYBRID), EMBEDDER, 'site'), { kind: 'hybrid', model: 'test/embed-8' });
    assert.deepEqual(planFor(meta(HYBRID), null, 'site'), { kind: 'bm25', model: null });
  });

  it('vector needs the embedder it was built with', () => {
    assert.deepEqual(planFor(meta(VECTOR), EMBEDDER, 'site'), { kind: 'dense', model: 'test/embed-8' });
    assert.throws(() => planFor(meta(VECTOR), null, 'site'), /"site" has no text index.*search\.embedder/);
  });

  it('an embedder for another model or dimension is refused, naming both', () => {
    assert.throws(() => planFor(meta(HYBRID), { ...EMBEDDER, model: 'other/model' }, 'site'), /"site" was built with test\/embed-8 \(dim 8\).*other\/model \(dim 8\)/);
    assert.throws(() => planFor(meta(VECTOR), { ...EMBEDDER, dim: 16 }, 'site'), /dim 16/);
  });

  it('no snapshot, or one this chat cannot read, is refused with the reason', () => {
    assert.throws(() => planFor(meta({ snapshot_bytes: null, snapshot_sha256: null, snapshot_format: null }), null, 'site'), /without a snapshot/);
    assert.throws(() => planFor(meta({ snapshot_format: 3 }), null, 'site'), /format 3.*format 2/);
  });
});

describe('queryBody', () => {
  it('bm25, dense and hybrid bodies', () => {
    assert.deepEqual(queryBody('free plan', { kind: 'bm25', model: null }, 5), { query: { text: 'free plan', model: 'bm25' }, limit: 5, with_payload: true });
    assert.deepEqual(queryBody('free plan', { kind: 'dense', model: 'm' }, 5), { query: { text: 'free plan', model: 'm' }, limit: 5, with_payload: true });
    assert.deepEqual(queryBody('free plan', { kind: 'hybrid', model: 'm' }, 5), {
      prefetch: [
        { query: { text: 'free plan', model: 'bm25' }, limit: 20 },
        { query: { text: 'free plan', model: 'm' }, limit: 20 },
      ],
      query: { fusion: 'rrf' },
      limit: 5,
      with_payload: true,
    });
  });
});

describe('parseQueryResponse', () => {
  const ok = JSON.stringify({ status: 'ok', result: { points: [{ id: 2, version: 0, score: 0.69, payload: { text: 'pricing' } }] } });

  it('returns the points of a 200', () => {
    assert.deepEqual(parseQueryResponse(200, ok), [{ id: 2, score: 0.69, payload: { text: 'pricing' } }]);
  });

  it('an error status carries the router message', () => {
    assert.throws(() => parseQueryResponse(404, JSON.stringify({ message: "Collection 'x' not found", status: 'error' })), /HTTP 404: Collection 'x' not found/);
    assert.throws(() => parseQueryResponse(503, 'not json'), /HTTP 503/);
  });

  it('a malformed 200 is an error, and points without an object payload are dropped', () => {
    assert.throws(() => parseQueryResponse(200, '{"status":"ok","result":{}}'), /no points/);
    const mixed = JSON.stringify({ status: 'ok', result: { points: [{ id: 1, score: 1, payload: null }, { id: 3, score: 0.5, payload: { text: 'x' } }] } });
    assert.deepEqual(parseQueryResponse(200, mixed), [{ id: 3, score: 0.5, payload: { text: 'x' } }]);
  });
});

describe('fuseRanked', () => {
  const hits = (...ids) => ids.map((id, i) => ({ id, score: 100 - i, payload: { text: String(id) } }));

  it('one corpus keeps its order, cut to topK', () => {
    const fused = fuseRanked([{ corpus: { id: 'a' }, hits: hits(5, 3, 9) }], 2);
    assert.deepEqual(fused.map((f) => f.hit.id), [5, 3]);
  });

  it('several corpora interleave by rank (RRF), never by raw score; ties go to config order', () => {
    const fused = fuseRanked(
      [
        { corpus: { id: 'a' }, hits: hits(1, 2, 3).map((h) => ({ ...h, score: h.score / 1000 })) },
        { corpus: { id: 'b' }, hits: hits(7, 8) },
      ],
      5
    );
    assert.deepEqual(
      fused.map((f) => `${f.corpus.id}:${f.hit.id}`),
      ['a:1', 'b:7', 'a:2', 'b:8', 'a:3']
    );
  });
});

describe('checkedEmbed', () => {
  it('passes vectors of the right shape through', async () => {
    const out = await checkedEmbed(EMBEDDER)(['a', 'b']);
    assert.equal(out.length, 2);
  });

  it('a wrong count or dimension is a clear error, not a silent bad search', async () => {
    await assert.rejects(checkedEmbed({ ...EMBEDDER, embed: async () => [] })(['a']), /returned 0 vectors for 1 text/);
    await assert.rejects(checkedEmbed({ ...EMBEDDER, embed: async (t) => t.map(() => new Float32Array(4)) })(['a']), /4 dimensions.*8/);
  });
});
