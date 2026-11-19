// action-env.mjs — shared by the input-contract tests: action.yml's declared
// inputs (parsed with a small line parser: the repo has no YAML dependency)
// and the INPUT_* env the composite step would build from them.

import { readFileSync } from 'node:fs';

import { ACTION_YML, actionEnv, parseActionInputs } from '../../scripts/run-as-action.mjs';
import { inputEnvName } from '../../src/action-inputs.mjs';

export { ACTION_YML };

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

/**
 * The env the composite step builds: every declared input, caller values
 * first, the rest action.yml's default or '' (scripts/run-as-action.mjs).
 */
export function envOf(overrides = {}) {
  const given = {};
  for (const [name, value] of Object.entries({ 'mock-embeddings': 'true', ...REQUIRED_VALUES, ...overrides })) {
    given[inputEnvName(name)] = value;
  }
  return actionEnv(DECLARED, given);
}

