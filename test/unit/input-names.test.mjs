// input-names.test.mjs — the code and action.yml name the same inputs.
//
// getInput throws on an absent INPUT_* variable, so a name the code reads
// that action.yml does not declare (a typo, a removed input) fails every
// run; this catches it before a run does. The other direction catches an
// input action.yml declares that no code reads (a caller's value would be
// silently ignored). The code's names are every input read through an env
// helper (`helper(env, 'name'`) in src/, plus V3_INPUTS (read by name in a loop).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { V3_INPUTS } from '../../src/inputs-v3.mjs';
import { DECLARED } from './action-env.mjs';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const READ = /\b\w+\(env, '([a-z0-9-]+)'/g;

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : e.name.endsWith('.mjs') ? [join(dir, e.name)] : []);
}

/** Input names read in `text` through an env helper. */
export function namesRead(text) {
  return [...text.matchAll(READ)].map((m) => m[1]);
}

const CODE = new Set([...sourceFiles(SRC).flatMap((f) => namesRead(readFileSync(f, 'utf8'))), ...V3_INPUTS]);
const DECLARED_NAMES = new Set(Object.keys(DECLARED));

describe('input names: src/ and action.yml agree', () => {
  it('the scan finds a real set of names', () => assert.ok(CODE.size >= 30, `${CODE.size} names`));

  it('the scan reads names from helper calls only', () => {
    assert.deepEqual(namesRead("getInput(env, 'a-b'); getIntInput(env, 'c', {}); log('d-e'); x(e, 'f')"), ['a-b', 'c']);
  });

  it('every input the code reads is declared in action.yml', () => {
    assert.deepEqual([...CODE].filter((n) => !DECLARED_NAMES.has(n)).sort(), []);
  });

  it('every input action.yml declares is read by the code', () => {
    assert.deepEqual([...DECLARED_NAMES].filter((n) => !CODE.has(n)).sort(), []);
  });
});
