// SPDX-License-Identifier: Apache-2.0
// Corpus meta validation, multi-corpus agreement, jsonl line parsing and the
// OPFS naming scheme (src/core/{manifest,jsonl,cache-names}.js).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { corpusFileName, metaFileName, parseCorpusFileName, parseMetaFileName } from '../../src/core/cache-names.js';
import { createLineSplitter, parseHeader, parsePoint } from '../../src/core/jsonl.js';
import { sharedEmbedding, validateMeta } from '../../src/core/manifest.js';

const META = {
  bytes: 15069,
  commit_sha: 'a3f9c1e7b2d84056917e2c3a4b5d6f7089abcde1',
  dim: 8,
  files: 15,
  generated_at: '2026-08-16T00:00:00Z',
  gz_bytes: 5742,
  model: 'embed/model:free',
  points: 20,
  repo: 'example-org/engine',
};

describe('validateMeta', () => {
  it('accepts an AutoRepoRAG meta and renames what the chat reads', () => {
    assert.deepEqual(validateMeta(META, 'code'), {
      commitSha: META.commit_sha, dim: 8, model: META.model, repo: META.repo, points: 20, files: 15, bytes: 15069, gzBytes: 5742, generatedAt: META.generated_at,
    });
  });

  // A numeric commit_sha used to pass a truthiness check, become a cache
  // filename, and then silently disable pruning.
  const bad = [
    ['commit_sha', 12345, /commit_sha must be a hex commit string/],
    ['commit_sha', '../../x', /commit_sha/],
    ['dim', 0, /dim must be a positive integer/],
    ['model', '', /model must name the embedding model/],
    ['repo', 'no-slash', /repo must be "owner\/name"/],
    ['points', -1, /points must be a non-negative integer/],
    ['gz_bytes', '5742', /gz_bytes/],
    ['generated_at', 0, /generated_at/],
  ];
  for (const [field, value, why] of bad) {
    it(`refuses ${field} = ${JSON.stringify(value)}, naming the corpus`, () => {
      assert.throws(() => validateMeta({ ...META, [field]: value }, 'docs'), (e) => why.test(e.message) && e.message.startsWith('corpus "docs" manifest:'));
    });
  }

  it('refuses a non-object', () => {
    for (const v of [null, [], 'x']) assert.throws(() => validateMeta(v, 'c'), /is not a JSON object/);
  });
});

describe('sharedEmbedding', () => {
  it('returns the one model and dim every corpus shares', () => {
    assert.deepEqual(sharedEmbedding([{ id: 'a', meta: { model: 'm', dim: 8 } }, { id: 'b', meta: { model: 'm', dim: 8 } }]), { model: 'm', dim: 8 });
  });

  it('fails clearly when corpora were built with different models or dims', () => {
    assert.throws(() => sharedEmbedding([{ id: 'a', meta: { model: 'm1', dim: 8 } }, { id: 'b', meta: { model: 'm2', dim: 8 } }]), /"a" was built with m1 but "b" with m2/);
    assert.throws(() => sharedEmbedding([{ id: 'a', meta: { model: 'm', dim: 8 } }, { id: 'b', meta: { model: 'm', dim: 16 } }]), /"a" has 8 but "b" has 16/);
  });
});

describe('jsonl lines', () => {
  const header = JSON.stringify({ t: 'header', format: 'lattice-jsonl', dim: 8, points: 2 });

  it('parses the header and checks it against the manifest dim', () => {
    assert.equal(parseHeader(header, 8).points, 2);
    assert.throws(() => parseHeader(header, 16), /header says 8 dimensions but the manifest says 16/);
    assert.throws(() => parseHeader('{"t":"point"}', 8), /missing header line/);
    assert.throws(() => parseHeader('not json', 8), /missing header line/);
  });

  it('keeps points and skips other records', () => {
    assert.deepEqual(parsePoint('{"t":"point","id":3,"vector":[1],"payload":{"text":"x"}}'), { id: 3, vector: [1], payload: { text: 'x' } });
    assert.equal(parsePoint('{"t":"edge","from":1,"to":2}'), null);
  });

  it('splits lines across arbitrary chunk boundaries, flushing the unterminated tail', async () => {
    const lines = [];
    const s = createLineSplitter(async (l) => lines.push(l));
    for (const chunk of ['al', 'pha\nbe', 'ta\n\n  \ngam', 'ma']) await s.push(chunk);
    await s.end();
    assert.deepEqual(lines, ['alpha', 'beta', 'gamma']);
  });
});

describe('cache names', () => {
  const sha = 'a'.repeat(40);

  it('round-trips (prefix, id, sha) through a file name', () => {
    assert.equal(corpusFileName('site-', 'code', sha), `site-~code@${sha}.jsonl`);
    assert.equal(parseCorpusFileName('site-', 'code', corpusFileName('site-', 'code', sha)), sha);
    assert.equal(parseMetaFileName('site-', 'code', metaFileName('site-', 'code', sha)), sha);
  });

  it("never claims another corpus's, another prefix's, or another kind's file", () => {
    const name = corpusFileName('site-', 'code', sha);
    assert.equal(parseCorpusFileName('site-', 'docs', name), null);
    assert.equal(parseCorpusFileName('site', '-code', name), null);
    assert.equal(parseCorpusFileName('other-', 'code', name), null);
    assert.equal(parseMetaFileName('site-', 'code', name), null);
    assert.equal(parseCorpusFileName('site-', 'code', 'lattice-db-abc.jsonl'), null);
  });
});
