// run-config.test.mjs — the run configuration fails fast (PCND): the
// workspace and the runner temp directory are required absolute paths, never
// the cwd. Plain env maps; nothing is faked.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { actionVersion, readRunConfig } from '../../src/run-config.mjs';
import { envOf } from './action-env.mjs';

const RUNNER = { GITHUB_WORKSPACE: '/work/repo', RUNNER_TEMP: '/work/_temp' };

describe('readRunConfig', () => {
  it('returns the inputs, workspace and temp dir when every value is given', () => {
    const config = readRunConfig({ ...envOf(), ...RUNNER });
    assert.equal(config.workspace, '/work/repo');
    assert.equal(config.tempBase, '/work/_temp');
    assert.equal(config.inputs.collection, 'coderag');
  });

  for (const name of ['GITHUB_WORKSPACE', 'RUNNER_TEMP']) {
    it(`refuses a missing ${name}, naming it`, () => {
      const env = { ...envOf(), ...RUNNER };
      delete env[name];
      assert.throws(() => readRunConfig(env), { message: new RegExp(`environment variable ${name} is required`) });
    });

    it(`refuses an empty ${name}`, () => {
      assert.throws(() => readRunConfig({ ...envOf(), ...RUNNER, [name]: '' }), { message: new RegExp(`${name} is required`) });
    });

    it(`refuses a relative ${name} (it would resolve against the cwd)`, () => {
      assert.throws(() => readRunConfig({ ...envOf(), ...RUNNER, [name]: 'repo' }), {
        message: new RegExp(`${name} must be an absolute path, got "repo"`),
      });
    });
  }

  it('names a missing input before the runner variables', () => {
    assert.throws(() => readRunConfig({ ...envOf({ collection: '' }) }), { message: /input "collection" is required/ });
  });
});

describe('actionVersion', () => {
  it('records the action ref the runner gives', () => assert.equal(actionVersion({ GITHUB_ACTION_REF: 'v3' }), 'v3'));
  it('records "local" when the action ran from a path (no ref)', () => {
    assert.equal(actionVersion({}), 'local');
    assert.equal(actionVersion({ GITHUB_ACTION_REF: '' }), 'local');
  });
});
