// SPDX-License-Identifier: Apache-2.0
// The openRepoChat config contract (src/config/validate.js): every key is
// required, every problem is reported in ONE error, nothing is defaulted.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ConfigError, validateConfig } from '../../src/config/validate.js';
import { COPY_EN } from '../../src/copy-en.js';
import { validConfig } from './config-fixture.js';

// Written out by hand, not derived from the validator's own spec: deriving it
// would make the test agree with whatever the validator happens to check.
const REQUIRED_LEAVES = [
  'mount',
  'assets.cssHref',
  'wasm.jsUrl',
  'wasm.binUrl',
  'corpora',
  'provider.apiUrl',
  'provider.rerankModel',
  'provider.chatModel',
  'provider.appTitle',
  'provider.referer',
  'provider.maxAttempts',
  'provider.retryBaseMs',
  'retrieval.topK',
  'retrieval.rerankMultiplier',
  'retrieval.upsertBatch',
  'storage.keyPrefix',
  'copy',
  'brand.productName',
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

/** Drop the leaf at a dotted path from a fresh valid config. */
function without(path) {
  const config = validConfig();
  const keys = path.split('.');
  const parent = keys.slice(0, -1).reduce((o, k) => o[k], config);
  delete parent[keys.at(-1)];
  return config;
}

describe('validateConfig', () => {
  it('accepts a complete config and returns it unchanged', () => {
    const config = validConfig();
    assert.equal(validateConfig(config), config);
  });

  it('openRepoChat({}) lists every missing key in one error', () => {
    const problems = problemsOf({});
    const missing = problems.map((p) => p.split(':')[0]);
    assert.deepEqual([...missing].sort(), [...REQUIRED_LEAVES].sort());
    assert.throws(() => validateConfig({}), (e) => REQUIRED_LEAVES.every((p) => e.message.includes(`  - ${p}: missing`)));
  });

  it('a non-object config is refused, still listing every key', () => {
    for (const bad of [undefined, null, 'cfg', []]) {
      const problems = problemsOf(bad);
      assert.equal(problems[0], 'config: must be a plain object');
      assert.equal(problems.length, REQUIRED_LEAVES.length + 1);
    }
  });

  for (const path of REQUIRED_LEAVES) {
    it(`dropping ${path} fails naming exactly it`, () => {
      const problems = problemsOf(without(path));
      assert.equal(problems.length, 1, problems.join('\n'));
      assert.match(problems[0], new RegExp(`^${path.replace('.', '\\.')}: missing`));
    });
  }

  it('the callbacks are optional, but must be functions when given', () => {
    assert.deepEqual(problemsOf({ ...validConfig(), onReady() {}, onClose() {} }), []);
    assert.deepEqual(problemsOf({ ...validConfig(), onReady: 'yes' }), ['onReady: must be a function']);
  });

  it('refuses an unknown key instead of ignoring a typo', () => {
    assert.deepEqual(problemsOf({ ...validConfig(), retreival: {} }), ['retreival: unknown key']);
    const config = validConfig();
    config.provider.embeddingModel = 'x';
    assert.deepEqual(problemsOf(config), ['provider.embeddingModel: unknown key']);
  });

  const invalid = [
    ['provider.apiUrl', 'ftp://openrouter.ai', /absolute http\(s\) URL/],
    ['provider.referer', '/relative', /absolute http\(s\) URL/],
    ['provider.maxAttempts', 0, /integer >= 1/],
    ['provider.retryBaseMs', 1.5, /integer >= 0/],
    ['retrieval.topK', '3', /integer >= 1/],
    ['storage.keyPrefix', 'site~', /\[A-Za-z0-9._-\]/],
    ['brand.motifSvg', '<img src=x>', /<svg>/],
    ['theme.accent', '', /non-empty string/],
    ['mount', { appendChild() {} }, /DOM Element/],
  ];
  for (const [path, value, why] of invalid) {
    it(`refuses ${path} = ${JSON.stringify(value)}`, () => {
      const config = validConfig();
      const keys = path.split('.');
      keys.slice(0, -1).reduce((o, k) => o[k], config)[keys.at(-1)] = value;
      const problems = problemsOf(config);
      assert.equal(problems.length, 1, problems.join('\n'));
      assert.match(problems[0], why);
    });
  }

  it('refuses an empty corpora list, a bad id and a duplicate id', () => {
    assert.match(problemsOf({ ...validConfig(), corpora: [] })[0], /^corpora: must be a non-empty array/);
    const config = validConfig();
    config.corpora[1].id = 'code';
    assert.deepEqual(problemsOf(config), ['corpora[1].id: duplicate corpus id "code"']);
    config.corpora[1].id = 'Has Space';
    assert.match(problemsOf(config)[0], /^corpora\[1\]\.id: must match/);
    delete config.corpora[0].gzUrl;
    assert.ok(problemsOf(config).includes('corpora[0].gzUrl: missing'));
  });

  it('copy must mirror COPY_EN: a missing key, an unknown key, a wrong type', () => {
    const copy = structuredClone(COPY_EN);
    delete copy.errors.quota.paid;
    copy.extra = 'x';
    copy.starters = 'not an array';
    assert.deepEqual(problemsOf({ ...validConfig(), copy }).sort(), [
      'copy.errors.quota.paid: missing (start from COPY_EN: { ...COPY_EN, ... })',
      'copy.extra: unknown key',
      'copy.starters: must be an array of non-empty strings',
    ]);
  });

  it('a copy template may only name the placeholders COPY_EN names', () => {
    const ok = { ...validConfig(), copy: { ...COPY_EN, corpusLine: '{commit}: {chunks} chunks' } };
    assert.deepEqual(problemsOf(ok), []);
    const bad = { ...validConfig(), copy: { ...COPY_EN, corpusLine: '{id} at {sha}' } };
    assert.deepEqual(problemsOf(bad), ['copy.corpusLine: unknown placeholder {sha} (allowed: {id} {chunks} {files} {commit})']);
  });

  it('COPY_EN is frozen all the way down, so a site cannot mutate the shared default', () => {
    assert.throws(() => {
      COPY_EN.errors.quota.tag = 'mutated';
    }, TypeError);
  });
});
