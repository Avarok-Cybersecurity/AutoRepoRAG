// lattice-version.mjs — which lattice-db releases a mode may use.
//
// Contract: pure. v3 (site corpora) needs lattice-db >= MIN_V3_LATTICE:
// BM25 text indexes, lexical-only collections, vectors.index/storage and
// snapshot format 2 first ship there. Only pinned vX.Y.Z tags compare; a
// floating "latest" is refused in v3 because two runs could then build on
// different servers.

export const MIN_V3_LATTICE = 'v0.5.0';

const TAG = /^v(\d+)\.(\d+)\.(\d+)$/;

/** @returns {[number, number, number] | null} */
export function parseTag(tag) {
  const m = TAG.exec(tag);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** True when `tag` is a pinned vX.Y.Z at or after `min`. */
export function atLeast(tag, min) {
  const a = parseTag(tag);
  const b = parseTag(min);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}
