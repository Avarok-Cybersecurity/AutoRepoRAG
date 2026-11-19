// files.mjs — which listed files are candidates for chunking.
//
// Contract: pure. The listing itself (git ls-files or a walk) is the
// io.listFiles port (src/adapters/list-files.mjs); selectFiles applies the
// include/exclude globs to it and sorts the result (code-unit order).

import { compileMatcher } from './util.mjs';

/** @typedef {'git'|'walk'} Listing */

/**
 * Apply include/exclude globs to a listing; sorted ascending.
 * @param {{listed: string[], includeGlobs: string[], excludeGlobs: string[]}} opts
 */
export function selectFiles({ listed, includeGlobs, excludeGlobs }) {
  const include = compileMatcher(includeGlobs);
  const exclude = excludeGlobs.length > 0 ? compileMatcher(excludeGlobs) : () => false;
  return listed.filter((p) => include(p) && !exclude(p)).sort();
}

/** A file is binary if its first 8 KiB contain a NUL byte. */
export function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}
