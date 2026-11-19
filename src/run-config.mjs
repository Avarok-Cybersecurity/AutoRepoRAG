// run-config.mjs — the run's configuration, parsed once at startup.
//
// Contract: pure. Takes the environment map (process.env in src/main.mjs, a
// literal in tests) and returns every value src/run.mjs needs, validated:
// the action inputs (src/inputs.mjs), the workspace and the runner's temp
// directory. GITHUB_WORKSPACE and RUNNER_TEMP are required absolute paths —
// the GitHub runner always sets both, and a local run must name them
// (scripts/local-dry-run.sh does); nothing falls back to the cwd.

import { isAbsolute } from 'node:path';

import { readInputs } from './inputs.mjs';

/** A required absolute-path environment variable; throws naming it when missing or relative. */
export function requireAbsoluteEnv(env, name) {
  const value = env[name];
  if (value === undefined || value === '') {
    throw new Error(`environment variable ${name} is required (the GitHub runner sets it; a local run must export it)`);
  }
  if (!isAbsolute(value)) throw new Error(`environment variable ${name} must be an absolute path, got ${JSON.stringify(value)}`);
  return value;
}

/**
 * The ref meta.json records as action_version: the runner's
 * GITHUB_ACTION_REF (`uses: owner/repo@ref`), or "local" when the action ran
 * from a path (`uses: ./`, or src/main.mjs run directly), where no ref exists.
 */
export function actionVersion(env) {
  const ref = env.GITHUB_ACTION_REF;
  return ref === undefined || ref === '' ? 'local' : ref;
}

/**
 * @param {Record<string, string|undefined>} env
 * @returns {{inputs: ReturnType<typeof readInputs>, workspace: string, tempBase: string, actionVersion: string}}
 */
export function readRunConfig(env) {
  const inputs = readInputs(env);
  return {
    inputs,
    workspace: requireAbsoluteEnv(env, 'GITHUB_WORKSPACE'),
    tempBase: requireAbsoluteEnv(env, 'RUNNER_TEMP'),
    actionVersion: actionVersion(env),
  };
}
