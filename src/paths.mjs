// paths.mjs — containment of user-supplied directory inputs.
//
// Contract: pure. A directory input (source-dir, website-chat-dir) names a
// path relative to a base the action owns (the workspace, the output-dir);
// it must not be absolute and must not climb out of that base.

import { isAbsolute, normalize, sep } from 'node:path';

/**
 * Normalise `rel` and prove it stays inside `baseName`. Returns the
 * normalised relative path without a trailing separator ('.' for the base
 * itself, however it was spelled: '.', './', 'a/..').
 * @param {string} rel        the input's value
 * @param {string} inputName  e.g. 'source-dir'
 * @param {string} baseName   e.g. 'workspace'
 */
export function relativeInside(rel, inputName, baseName) {
  if (isAbsolute(rel)) {
    throw new Error(`${inputName} must be relative to the ${baseName}, got absolute path ${JSON.stringify(rel)}`);
  }
  const norm = normalize(rel).replace(/\/+$/, '') || '.';
  if (norm === '..' || norm.startsWith(`..${sep}`)) {
    throw new Error(`${inputName} must stay inside the ${baseName}, got ${JSON.stringify(rel)}`);
  }
  return norm;
}
