// action-env.mjs — shared by the input-contract tests: action.yml's declared
// inputs (parsed with a small line parser: the repo has no YAML dependency)
// and the INPUT_* env the composite step would build from them.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { inputEnvName } from '../../src/util.mjs';

export const ACTION_YML = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'action.yml');

/** Parse the top-level `inputs:` block into { name: { required, default } }. */
export function parseActionInputs(text) {
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

export const ACTION_TEXT = readFileSync(ACTION_YML, 'utf8');
export const DECLARED = parseActionInputs(ACTION_TEXT);

// The corpus-shaping set the v2 contract makes explicit (the plan's PCND list).
export const PCND = [
  'embedding-endpoint', 'chunk-lines', 'chunk-overlap', 'max-chunk-bytes',
  'vector-precision', 'lattice-version', 'collection', 'request-interval-ms',
];

// Corpus-shaping inputs v3 made conditional: v2 runs (and v3 runs that use
// them: vectors on, or chunk-strategy "lines") must state them, a lexical or
// markdown v3 run may not. action.yml declares them optional with '' so
// GitHub/actionlint do not demand them of a lexical caller; src/inputs.mjs
// enforces the condition and names the input.
export const CONDITIONAL = [
  'embedding-endpoint', 'chunk-lines', 'chunk-overlap', 'vector-precision', 'request-interval-ms',
];

// Caller values for every input a v2 run must state; mock mode needs no key or model.
export const REQUIRED_VALUES = {
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
export function envOf(overrides = {}) {
  const env = {};
  for (const [name, spec] of Object.entries(DECLARED)) {
    if (spec.default !== undefined) env[inputEnvName(name)] = spec.default;
  }
  for (const [name, value] of Object.entries({ 'mock-embeddings': 'true', ...REQUIRED_VALUES, ...overrides })) {
    env[inputEnvName(name)] = value;
  }
  return env;
}

