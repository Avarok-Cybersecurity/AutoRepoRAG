// SPDX-License-Identifier: Apache-2.0
// The search-mode half of the config contract (src/config/validate.js):
// corpora are snapshots, `search` replaces `provider` and `retrieval`, brand
// carries only the watermark, and the answer-mode keys are refused.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ConfigError, validateConfig } from '../../src/config/validate.js';
import { validSearchConfig } from './config-fixture.js';

// Written out by hand, as in validate.test.js.
const SEARCH_LEAVES = [
  'mount',
  'assets.cssHref',
  'wasm.jsUrl',
  'wasm.binUrl',
  'corpora',
  'search.topK',
  'search.snippetChars',
  'search.embedder',
  'storage.keyPrefix',
  'copy',
  'brand.motifSvg',
  ...['bg', 'bg2', 'card', 'border', 'borderStrong', 'text', 'text2', 'text3', 'accent', 'accentSoft', 'onAccent', 'green', 'amber', 'fontMono', 'fontSans', 'shadowLg'].map((k) => `theme.${k}`),
];

function problemsOf(config) {
  try {
    validateConfig(config);
  } catch (e) {
    assert.ok(e instanceof ConfigError, `expected a ConfigError, got ${e}`);
    return e.problems;
  }
  return [];
}

function set(config, path, value) {
  const keys = path.split('.');
  const parent = keys.slice(0, -1).reduce((o, k) => o[k], config);
  if (value === undefined) delete parent[keys.at(-1)];
  else parent[keys.at(-1)] = value;
  return config;
}

const embedder = () => ({ model: 'test/embed-8', dim: 8, embed: async (texts) => texts.map(() => new Float32Array(8)) });

describe('validateConfig, search mode', () => {
  it('accepts a complete search config, with and without an embedder', () => {
    const config = validSearchConfig();
    assert.equal(validateConfig(config), config);
    assert.deepEqual(problemsOf(set(validSearchConfig(), 'search.embedder', embedder())), []);
  });

  it('{ mode: "search" } lists every search-mode key in one error', () => {
    const missing = problemsOf({ mode: 'search' }).map((p) => p.split(':')[0]);
    assert.deepEqual([...missing].sort(), [...SEARCH_LEAVES].sort());
  });

  for (const path of SEARCH_LEAVES) {
    it(`dropping ${path} fails naming exactly it`, () => {
      const problems = problemsOf(set(validSearchConfig(), path, undefined));
      assert.equal(problems.length, 1, problems.join('\n'));
      assert.ok(problems[0].startsWith(`${path}: missing`), problems[0]);
    });
  }

  it('refuses the answer-mode keys: no provider, no retrieval, no product name', () => {
    const config = { ...validSearchConfig(), provider: {}, retrieval: {} };
    config.brand.productName = 'Example';
    assert.deepEqual(problemsOf(config).sort(), ['brand.productName: unknown key', 'provider: unknown key', 'retrieval: unknown key']);
  });

  it('corpora are { id, snapshotUrl, metaUrl }: a gzUrl is refused, ids stay unique', () => {
    const config = validSearchConfig();
    config.corpora[0] = { id: 'site', gzUrl: 'https://example.test/site.jsonl.gz', metaUrl: 'https://example.test/site.meta.json' };
    config.corpora[1].id = 'site';
    assert.deepEqual(problemsOf(config).sort(), ['corpora[0].gzUrl: unknown key', 'corpora[0].snapshotUrl: missing', 'corpora[1].id: duplicate corpus id "site"']);
    assert.match(problemsOf({ ...validSearchConfig(), corpora: [] })[0], /^corpora: must be a non-empty array of \{ id, snapshotUrl, metaUrl \}/);
  });

  const invalid = [
    ['search.topK', 0, /integer >= 1/],
    ['search.snippetChars', 10, /integer >= 40/],
    ['search.embedder', 'bge', /null or \{ model, dim, embed \}/],
    ['search.embedder.model', '', /non-empty string/],
    ['search.embedder.dim', 0, /integer >= 1/],
    ['search.embedder.embed', 'fn', /function/],
  ];
  for (const [path, value, why] of invalid) {
    it(`refuses ${path} = ${JSON.stringify(value)}`, () => {
      const config = set(validSearchConfig(), 'search.embedder', embedder());
      const problems = problemsOf(set(config, path, value));
      assert.equal(problems.length, 1, problems.join('\n'));
      assert.match(problems[0], why);
    });
  }

  it('an embedder must name exactly model, dim and embed', () => {
    const config = set(validSearchConfig(), 'search.embedder', { ...embedder(), endpoint: 'https://x.test' });
    assert.deepEqual(problemsOf(config), ['search.embedder.endpoint: unknown key']);
    const partial = set(validSearchConfig(), 'search.embedder', { model: 'm' });
    assert.deepEqual(problemsOf(partial).sort(), ['search.embedder.dim: missing', 'search.embedder.embed: missing']);
  });
});
