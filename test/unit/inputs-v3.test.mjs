// inputs-v3.test.mjs — the v3 (site corpus) input contract.
//
// v3 mode is on when any v3-only input is set. It then requires
// chunk-strategy, search-mode and snapshot; the conditional v2 inputs are
// required or refused by what those choose; and lattice-version must be a
// pinned tag >= v0.5.1.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { readInputs } from '../../src/inputs.mjs';
import { V3_INPUTS } from '../../src/inputs-v3.mjs';
import { inputEnvName } from '../../src/util.mjs';
import { CONDITIONAL, DECLARED, envOf } from './action-env.mjs';

const SHA = 'a'.repeat(40);

// A lexical markdown site run, as GeoHarness calls it: only what applies.
const SITE = {
  'files-dir': 'dist',
  'corpus-repo': 'acme/site',
  'corpus-commit': SHA,
  'chunk-strategy': 'markdown',
  'search-mode': 'lexical',
  snapshot: 'true',
  'max-snapshot-bytes': String(25 * 1024 * 1024),
  'lattice-version': 'v0.5.1',
};

/** v2 required values minus the conditional inputs, plus v3 overrides. */
function siteEnv(overrides = {}) {
  const env = envOf({ ...SITE, 'mock-embeddings': 'false', ...overrides });
  for (const name of CONDITIONAL) if (!(name in overrides)) env[inputEnvName(name)] = '';
  return env;
}

describe('action.yml declares every v3 input optional with an empty default', () => {
  for (const name of V3_INPUTS) {
    it(name, () => {
      assert.ok(DECLARED[name], `${name} missing from action.yml`);
      assert.equal(DECLARED[name].required, false);
      assert.equal(DECLARED[name].default, '');
    });
  }
});

describe('readInputs: v3 mode', () => {
  it('v2 runs have v3 null and the lines strategy', () => {
    assert.equal(readInputs(envOf()).v3, null);
  });

  it('accepts a lexical markdown site run with no embedding inputs at all', () => {
    const inputs = readInputs(siteEnv());
    assert.deepEqual(inputs.v3, {
      filesDir: 'dist', corpusRepo: 'acme/site', corpusCommit: SHA, chunkStrategy: 'markdown',
      payloadSidecar: '', edgesFile: '', searchMode: 'lexical', vectorIndex: null, vectorStorage: null,
      snapshot: true, maxSnapshotBytes: 25 * 1024 * 1024,
    });
    assert.equal(inputs.endpoint, '');
    assert.equal(inputs.chunkLines, null);
  });

  for (const name of ['chunk-strategy', 'search-mode', 'snapshot']) {
    it(`requires ${name}, saying why v3 mode is on`, () => {
      assert.throws(
        () => readInputs(siteEnv({ [name]: '' })),
        { message: new RegExp(`^input "${name}" is required in v3 mode \\(on because files-dir is set\\)`) },
      );
    });
  }

  it('any single v3 input turns v3 mode on', () => {
    assert.throws(
      () => readInputs(envOf({ 'edges-file': 'edges.json' })),
      { message: /^input "chunk-strategy" is required in v3 mode \(on because edges-file is set\)/ },
    );
  });

  for (const [name, value, re] of [
    ['chunk-strategy', 'words', /input "chunk-strategy" must be one of "lines", "markdown"/],
    ['search-mode', 'semantic', /input "search-mode" must be one of "lexical", "vector", "hybrid"/],
    ['snapshot', 'yes', /input "snapshot" must be "true" or "false"/],
    ['corpus-repo', 'acme', /input "corpus-repo" must be "owner\/name"/],
    ['corpus-commit', 'abc123', /input "corpus-commit" must be a full 40- or 64-hex commit id/],
    ['max-snapshot-bytes', '0', /input "max-snapshot-bytes" must be >= 1/],
  ]) {
    it(`rejects ${name}=${value}`, () => assert.throws(() => readInputs(siteEnv({ [name]: value })), { message: re }));
  }

  it('requires lattice-version >= v0.5.1, pinned', () => {
    for (const v of ['v0.3.3', 'v0.4.9', 'v0.5.0', 'latest', '0.5.1']) {
      assert.throws(() => readInputs(siteEnv({ 'lattice-version': v })), { message: /v3 mode needs lattice-version >= v0\.5\.1/ });
    }
    for (const v of ['v0.5.1', 'v0.5.10', 'v0.10.1', 'v1.0.0']) assert.equal(readInputs(siteEnv({ 'lattice-version': v })).latticeVersion, v);
  });

  it('files-dir requires corpus-repo and corpus-commit; they are refused without it', () => {
    assert.throws(() => readInputs(siteEnv({ 'corpus-repo': '' })), { message: /"corpus-repo" is required when files-dir is set/ });
    assert.throws(() => readInputs(siteEnv({ 'corpus-commit': '' })), { message: /"corpus-commit" is required when files-dir is set/ });
    assert.throws(() => readInputs(siteEnv({ 'files-dir': '' })), { message: /"corpus-repo" is only valid when files-dir is set/ });
  });

  it('files-dir and source-dir are mutually exclusive; files-dir stays in the workspace', () => {
    assert.throws(() => readInputs(siteEnv({ 'source-dir': 'ext' })), { message: /files-dir and source-dir are mutually exclusive/ });
    assert.throws(() => readInputs(siteEnv({ 'files-dir': '../dist' })), { message: /^files-dir must stay inside the workspace/ });
    assert.equal(readInputs(siteEnv({ 'files-dir': './dist/' })).v3.filesDir, 'dist');
  });

  it('max-snapshot-bytes is required iff snapshot is true', () => {
    assert.throws(() => readInputs(siteEnv({ 'max-snapshot-bytes': '' })), { message: /"max-snapshot-bytes" is required when snapshot is "true"/ });
    assert.throws(() => readInputs(siteEnv({ snapshot: 'false' })), { message: /"max-snapshot-bytes" is only valid when snapshot is "true"/ });
    assert.equal(readInputs(siteEnv({ snapshot: 'false', 'max-snapshot-bytes': '' })).v3.snapshot, false);
  });

  it('lexical refuses every embedding input instead of ignoring it', () => {
    for (const [name, value] of [
      ['embedding-endpoint', 'https://x/v1'], ['embedding-model', 'm'], ['embedding-api-key', 'k'],
      ['vector-precision', '6'], ['request-interval-ms', '0'], ['vector-index', 'flat'], ['vector-storage', 'f16'],
      ['mock-embeddings', 'true'],
    ]) {
      assert.throws(
        () => readInputs(siteEnv({ [name]: value })),
        { message: new RegExp(`"${name}" is only valid when search-mode is "vector" or "hybrid"`) },
        name,
      );
    }
  });

  it('vector and hybrid require the vector options and the embedding inputs', () => {
    const vec = { 'search-mode': 'hybrid', 'vector-index': 'flat', 'vector-storage': 'f16', 'mock-embeddings': 'true',
      'embedding-endpoint': 'https://x/v1', 'vector-precision': '6', 'request-interval-ms': '0' };
    const ok = readInputs(siteEnv(vec));
    assert.equal(ok.v3.vectorIndex, 'flat');
    assert.equal(ok.v3.vectorStorage, 'f16');
    for (const name of ['vector-index', 'vector-storage', 'embedding-endpoint', 'vector-precision', 'request-interval-ms']) {
      assert.throws(() => readInputs(siteEnv({ ...vec, [name]: '' })), { message: new RegExp(`^input "${name}" is required`) }, name);
    }
    assert.throws(() => readInputs(siteEnv({ ...vec, 'vector-index': 'ivf' })), { message: /must be one of "hnsw", "flat"/ });
    assert.throws(() => readInputs(siteEnv({ ...vec, 'vector-storage': 'f64' })), { message: /must be one of "f32", "f16", "int8"/ });
  });

  it('chunk-lines/chunk-overlap: required for "lines", refused for "markdown"', () => {
    assert.throws(() => readInputs(siteEnv({ 'chunk-lines': '90' })), { message: /"chunk-lines" is only valid when chunk-strategy is "lines"/ });
    assert.throws(() => readInputs(siteEnv({ 'chunk-strategy': 'lines' })), { message: /^input "chunk-lines" is required/ });
    const lines = readInputs(siteEnv({ 'chunk-strategy': 'lines', 'chunk-lines': '40', 'chunk-overlap': '5' }));
    assert.equal(lines.chunkLines, 40);
  });

  it('previous-corpus-url is refused in lexical mode (there are no vectors to reuse)', () => {
    assert.throws(
      () => readInputs(siteEnv({ 'previous-corpus-url': 'file:///c.gz', 'previous-corpus-meta-url': 'file:///c.json' })),
      { message: /"previous-corpus-url" is only valid when search-mode is "vector" or "hybrid"/ },
    );
  });
});
