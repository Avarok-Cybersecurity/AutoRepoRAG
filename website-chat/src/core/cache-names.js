// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// cache-names.js — the OPFS layout, as pure functions. One decompressed
// corpus file per (corpus id, commit), plus a sidecar holding its validated
// meta so the corpus can still be served when the manifest is unreachable:
//   <keyPrefix>~<id>@<sha>.jsonl
//   <keyPrefix>~<id>@<sha>.meta.json
// Neither `~` nor `@` can occur in a key prefix or a corpus id (validate.js),
// so a name parses back to exactly one (prefix, id, sha) and one site's
// prefix can never claim another's files.
// =============================================================================

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function corpusFileName(keyPrefix, id, sha) {
  return `${keyPrefix}~${id}@${sha}.jsonl`;
}

export function metaFileName(keyPrefix, id, sha) {
  return `${keyPrefix}~${id}@${sha}.meta.json`;
}

/** The sha of a cached corpus file of corpus `id`, or null for any other name. */
export function parseCorpusFileName(keyPrefix, id, name) {
  const m = new RegExp(`^${escapeRe(`${keyPrefix}~${id}@`)}([0-9a-f]{7,64})\\.jsonl$`).exec(name);
  return m ? m[1] : null;
}

/** The sha of a cached meta sidecar of corpus `id`, or null. */
export function parseMetaFileName(keyPrefix, id, name) {
  const m = new RegExp(`^${escapeRe(`${keyPrefix}~${id}@`)}([0-9a-f]{7,64})\\.meta\\.json$`).exec(name);
  return m ? m[1] : null;
}
