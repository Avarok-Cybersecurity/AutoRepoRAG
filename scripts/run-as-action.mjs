#!/usr/bin/env node
// run-as-action.mjs — run a command with the INPUT_* environment the GitHub
// runner builds for this composite action.
//
// Contract: action.yml is the only list of inputs. Its `inputs:` block is
// parsed (a small line parser: the repo has no YAML dependency) and, as the
// runner does, every declared input the caller left unset gets action.yml's
// default, or '' when it declares none. Values the caller set (including '')
// are kept. Tooling only: the unit tests' envOf, scripts/local-dry-run.sh and
// ci.yml's "Missing required input fails" step use it, so none of them copies
// the input list. src/ never imports it; there an unset INPUT_* is an error.
//
// Usage: node scripts/run-as-action.mjs <command> [args...]

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { inputEnvName } from '../src/action-inputs.mjs';

export const ACTION_YML = fileURLToPath(new URL('../action.yml', import.meta.url));

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

/**
 * `given` completed the way the runner completes it: each declared input
 * missing from `given` gets its action.yml default, or ''.
 * @param {Record<string, {default: string|undefined}>} declared
 * @param {Record<string, string|undefined>} given
 */
export function actionEnv(declared, given) {
  const env = { ...given };
  for (const [name, spec] of Object.entries(declared)) {
    const key = inputEnvName(name);
    if (env[key] === undefined) env[key] = spec.default === undefined ? '' : spec.default;
  }
  return env;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    console.error('usage: node scripts/run-as-action.mjs <command> [args...]');
    process.exit(2);
  }
  const declared = parseActionInputs(readFileSync(ACTION_YML, 'utf8'));
  const r = spawnSync(command, args, { env: actionEnv(declared, process.env), stdio: 'inherit' });
  if (r.error) {
    console.error(`run-as-action: ${command}: ${r.error.message}`);
    process.exit(1);
  }
  process.exit(r.status ?? 1);
}
