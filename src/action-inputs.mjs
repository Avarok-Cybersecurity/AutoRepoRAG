// action-inputs.mjs — read composite-action inputs from an INPUT_* env map.
//
// Contract: pure. action.yml maps every input to an INPUT_* variable; these
// helpers read, trim and validate one, naming the input on failure. The map
// is a parameter: callers pass process.env, tests pass a literal.

export function inputEnvName(name) {
  return `INPUT_${name.replace(/-/g, '_').toUpperCase()}`;
}

/**
 * Read a composite-action input from an INPUT_* environment map. Trimmed;
 * '' means the caller did not give it (the runner renders an ungiven input
 * as ''). action.yml maps every input it declares, so an absent variable
 * means the code and action.yml disagree (a misspelt or undeclared name):
 * that throws, naming the input, instead of passing for "not given".
 */
export function getInput(env, name) {
  const key = inputEnvName(name);
  const v = env[key];
  if (v === undefined) {
    throw new Error(
      `input "${name}" is not set: env ${key} is absent, and action.yml maps every input it declares ` +
        '(is the name declared there? a local run: scripts/run-as-action.mjs sets them all)',
    );
  }
  return v.trim();
}

export function getRequiredInput(env, name) {
  const v = getInput(env, name);
  if (!v) throw new Error(`input "${name}" is required (env ${inputEnvName(name)} is empty)`);
  return v;
}

export function getBoolInput(env, name) {
  const raw = getRequiredInput(env, name);
  const v = raw.toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  throw new Error(`input "${name}" must be "true" or "false", got ${JSON.stringify(raw)}`);
}

export function getIntInput(env, name, { min, max }) {
  const raw = getRequiredInput(env, name);
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`input "${name}" must be a base-10 integer, got ${JSON.stringify(raw)}`);
  }
  const v = Number(raw);
  if (!Number.isSafeInteger(v)) {
    throw new Error(`input "${name}" must be a safe integer, got ${JSON.stringify(raw)}`);
  }
  if (v < min) throw new Error(`input "${name}" must be >= ${min}, got ${v}`);
  if (max !== undefined && v > max) {
    throw new Error(`input "${name}" must be <= ${max}, got ${v}`);
  }
  return v;
}
