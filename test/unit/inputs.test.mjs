// inputs.test.mjs — the v2 input contract, checked against action.yml itself.
//
// action.yml is the single source of truth for which inputs exist, which are
// required and what the plumbing defaults are. These tests read it (a small
// line parser: the repo has no YAML dependency) and prove that src/inputs.mjs
// agrees with it: the declared defaults plus the required inputs make a valid
// run, and dropping any required input fails naming that input.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readInputs } from '../../src/inputs.mjs';
import { inputEnvName } from '../../src/util.mjs';

const ACTION_YML = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'action.yml');

/** Parse the top-level `inputs:` block into { name: { required, default } }. */
function parseActionInputs(text) {
  const out = {};
  let inInputs = false;
  let current = null;
  for (const line of text.split('\n')) {
    if (/^\S/.test(line)) {
      inInputs = line === 'inputs:';
      current = null;
      continue;
    }
    if (!inInputs) continue;
    const name = /^ {2}([a-z0-9-]+):\s*$/.exec(line);
    if (name) {
      current = { required: undefined, default: undefined };
      out[name[1]] = current;
      continue;
    }
    const field = /^ {4}(required|default):\s*(.*)$/.exec(line);
    if (field && current) {
      const raw = field[2].trim();
      current[field[1]] = field[1] === 'required' ? raw === 'true' : raw.replace(/^'(.*)'$/, '$1');
    }
  }
  return out;
}

const ACTION_TEXT = readFileSync(ACTION_YML, 'utf8');
const DECLARED = parseActionInputs(ACTION_TEXT);

// The corpus-shaping set the v2 contract makes explicit (the plan's PCND list).
const PCND = [
  'embedding-endpoint', 'chunk-lines', 'chunk-overlap', 'max-chunk-bytes',
  'vector-precision', 'lattice-version', 'collection', 'request-interval-ms',
];

// Caller values for every required input; mock mode needs no key or model.
const REQUIRED_VALUES = {
  paths: 'src/**',
  collection: 'coderag',
  'embedding-endpoint': 'https://openrouter.ai/api/v1',
  'chunk-lines': '90',
  'chunk-overlap': '15',
  'max-chunk-bytes': '16384',
  'request-interval-ms': '2500',
  'vector-precision': '6',
  'lattice-version': 'v0.3.3',
  'generate-website-chat': 'false',
};

/** The env the composite step builds: action.yml defaults, then caller values. */
function envOf(overrides = {}) {
  const env = {};
  for (const [name, spec] of Object.entries(DECLARED)) {
    if (spec.default !== undefined) env[inputEnvName(name)] = spec.default;
  }
  for (const [name, value] of Object.entries({ 'mock-embeddings': 'true', ...REQUIRED_VALUES, ...overrides })) {
    env[inputEnvName(name)] = value;
  }
  return env;
}

describe('action.yml declares the v2 contract', () => {
  it('parses a non-trivial inputs block', () => {
    assert.ok(Object.keys(DECLARED).length >= 25, `only ${Object.keys(DECLARED).length} inputs parsed`);
  });

  for (const name of PCND) {
    it(`${name} is required with no default`, () => {
      assert.ok(DECLARED[name], `${name} missing from action.yml`);
      assert.equal(DECLARED[name].required, true);
      assert.equal(DECLARED[name].default, undefined);
    });
  }

  it('every required input is exactly the set the tests supply', () => {
    const required = Object.keys(DECLARED).filter((n) => DECLARED[n].required).sort();
    assert.deepEqual(required, Object.keys(REQUIRED_VALUES).sort());
  });

  it('no required input carries a default, every optional one does', () => {
    for (const [name, spec] of Object.entries(DECLARED)) {
      assert.equal(spec.default === undefined, spec.required, `${name}: required=${spec.required} default=${spec.default}`);
    }
  });

  it('every input is mapped to its INPUT_* env var in the build step', () => {
    for (const name of Object.keys(DECLARED)) {
      assert.ok(
        ACTION_TEXT.includes(`${inputEnvName(name)}: \${{ inputs.${name} }}`),
        `${name} is not mapped to ${inputEnvName(name)}`,
      );
    }
  });
});

describe('readInputs', () => {
  it('accepts action.yml defaults plus the required inputs', () => {
    const inputs = readInputs(envOf());
    assert.equal(inputs.collection, 'coderag');
    assert.equal(inputs.endpoint, 'https://openrouter.ai/api/v1');
    assert.equal(inputs.latticeVersion, 'v0.3.3');
    assert.equal(inputs.sourceDir, '');
    assert.equal(inputs.outputDir, DECLARED['output-dir'].default);
    assert.equal(inputs.generateWebsiteChat, false);
  });

  for (const name of Object.keys(REQUIRED_VALUES)) {
    it(`fails naming "${name}" when it is missing`, () => {
      const env = envOf();
      delete env[inputEnvName(name)];
      assert.throws(() => readInputs(env), { message: new RegExp(`^input "${name}" is required`) });
    });
  }

  it('reads plumbing inputs as required too (no fallback duplicated in code)', () => {
    const env = envOf();
    delete env[inputEnvName('output-dir')];
    assert.throws(() => readInputs(env), { message: /^input "output-dir" is required/ });
  });

  it('requires previous-corpus-meta-url iff previous-corpus-url is set', () => {
    assert.throws(
      () => readInputs(envOf({ 'previous-corpus-url': 'file:///c.jsonl.gz' })),
      { message: /"previous-corpus-meta-url" is required when previous-corpus-url is set/ },
    );
    assert.throws(
      () => readInputs(envOf({ 'previous-corpus-meta-url': 'file:///c.meta.json' })),
      { message: /"previous-corpus-meta-url" is only valid when previous-corpus-url is set/ },
    );
    const ok = readInputs(envOf({
      'previous-corpus-url': 'file:///c.jsonl.gz',
      'previous-corpus-meta-url': 'file:///c.meta.json',
    }));
    assert.equal(ok.previousCorpusMetaUrl, 'file:///c.meta.json');
  });

  it('rejects anything but "true"/"false" for generate-website-chat', () => {
    assert.throws(() => readInputs(envOf({ 'generate-website-chat': 'yes' })), { message: /must be "true" or "false"/ });
  });

  it('accepts generate-website-chat "true" with a website-chat-dir, normalised', () => {
    const inputs = readInputs(envOf({ 'generate-website-chat': 'true', 'website-chat-dir': 'site/./chat/' }));
    assert.equal(inputs.generateWebsiteChat, true);
    assert.equal(inputs.websiteChatDir, 'site/chat');
  });

  it('requires website-chat-dir when generate-website-chat is "true"', () => {
    assert.throws(
      () => readInputs(envOf({ 'generate-website-chat': 'true' })),
      { message: /"website-chat-dir" is required when generate-website-chat is "true"/ },
    );
  });

  it('refuses an absolute website-chat-dir', () => {
    assert.throws(
      () => readInputs(envOf({ 'generate-website-chat': 'true', 'website-chat-dir': '/srv/www' })),
      { message: /^website-chat-dir must be relative to the output-dir, got absolute path "\/srv\/www"/ },
    );
  });

  for (const esc of ['..', '../site', 'chat/../../x']) {
    it(`refuses a website-chat-dir escaping the output-dir (${esc})`, () => {
      assert.throws(
        () => readInputs(envOf({ 'generate-website-chat': 'true', 'website-chat-dir': esc })),
        { message: /^website-chat-dir must stay inside the output-dir/ },
      );
    });
  }

  for (const self of ['.', './', 'chat/..']) {
    it(`refuses website-chat-dir naming the output-dir itself (${self})`, () => {
      assert.throws(
        () => readInputs(envOf({ 'generate-website-chat': 'true', 'website-chat-dir': self })),
        { message: /must name a subdirectory of the output-dir/ },
      );
    });
  }

  it('rejects website-chat-dir when generate-website-chat is "false"', () => {
    assert.throws(
      () => readInputs(envOf({ 'website-chat-dir': 'site/chat' })),
      { message: /"website-chat-dir" is only valid when/ },
    );
  });

  it('requires model and key outside mock mode', () => {
    assert.throws(() => readInputs(envOf({ 'mock-embeddings': 'false' })), { message: /embedding-model is required/ });
    assert.throws(
      () => readInputs(envOf({ 'mock-embeddings': 'false', 'embedding-model': 'm' })),
      { message: /embedding-api-key is required/ },
    );
  });

  it('rejects chunk-overlap >= chunk-lines', () => {
    assert.throws(() => readInputs(envOf({ 'chunk-overlap': '90' })), { message: /chunk-overlap \(90\) must be < chunk-lines/ });
  });
});
