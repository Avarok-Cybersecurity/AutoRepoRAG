// action-inputs.mjs — read composite-action inputs from an INPUT_* env map.
//
// Contract: pure. action.yml maps every input to an INPUT_* variable; these
// helpers read, trim and validate one, naming the input on failure. The map
// is a parameter: callers pass process.env, tests pass a literal.

export function inputEnvName(name) {
  return `INPUT_${name.replace(/-/g, '_').toUpperCase()}`;
}

/**
 * Read a composite-action input from an INPUT_* environment map (action.yml
 * maps every input to one). Trimmed; '' when unset. The map is a parameter so
 * input parsing stays pure: callers pass process.env, tests pass a literal.
 */
export function getInput(env, name) {
  const v = env[inputEnvName(name)];
  return v === undefined ? '' : v.trim();
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
