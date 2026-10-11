// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// template.js — `{name}` substitution for copy strings. Pure. validate.js has
// already refused a copy string naming a placeholder COPY_EN does not, so a
// missing value here is a library bug and fails loudly.
// =============================================================================

export function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    if (!Object.hasOwn(vars, name)) throw new Error(`copy template ${JSON.stringify(template)} names {${name}} but no value was given`);
    return String(vars[name]);
  });
}
