// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// cache-names.js — the OPFS layout, as pure functions. One corpus file per
// (corpus id, commit), plus a sidecar holding its validated meta so the
// corpus can still be served when the manifest is unreachable:
//   <keyPrefix>~<id>@<sha>.<ext>
//   <keyPrefix>~<id>@<sha>.meta.json
//   <keyPrefix>~<id>@<sha>.<ext>.part   a download in progress (or a failed
//                                        one whose removal failed); moved to
//                                        the corpus name only when complete
// `<ext>` is the layout's: "jsonl" for the decompressed corpora answer mode
// indexes, "lattice" for the snapshots search mode installs, so the two
// modes never serve each other's files.
// Neither `~` nor `@` can occur in a key prefix or a corpus id (validate.js),
// so a name parses back to exactly one (prefix, id, sha) and one site's
// prefix can never claim another's files.
// =============================================================================

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @typedef {object} CacheLayout
 * @property {(keyPrefix: string, id: string, sha: string) => string} corpusFileName
 * @property {(keyPrefix: string, id: string, sha: string) => string} metaFileName
 * @property {(keyPrefix: string, id: string, sha: string) => string} partialFileName
 * @property {(keyPrefix: string, id: string, name: string) => string|null} parseCorpusFileName
 * @property {(keyPrefix: string, id: string, name: string) => string|null} parseMetaFileName
 * @property {(keyPrefix: string, id: string, name: string) => string|null} parsePartialFileName
 */

/**
 * The layout for corpus files ending in `.<ext>`.
 * @param {'jsonl'|'lattice'} ext
 * @returns {CacheLayout}
 */
export function cacheLayout(ext) {
  const corpusFileName = (keyPrefix, id, sha) => `${keyPrefix}~${id}@${sha}.${ext}`;
  const parser = (suffix) => (keyPrefix, id, name) => {
    const m = new RegExp(`^${escapeRe(`${keyPrefix}~${id}@`)}([0-9a-f]{7,64})${escapeRe(suffix)}$`).exec(name);
    return m ? m[1] : null;
  };
  return Object.freeze({
    corpusFileName,
    metaFileName: (keyPrefix, id, sha) => `${keyPrefix}~${id}@${sha}.meta.json`,
    partialFileName: (keyPrefix, id, sha) => `${corpusFileName(keyPrefix, id, sha)}.part`,
    parseCorpusFileName: parser(`.${ext}`),
    parseMetaFileName: parser('.meta.json'),
    parsePartialFileName: parser(`.${ext}.part`),
  });
}

/** Answer mode's layout: decompressed lattice-jsonl corpora. */
export const JSONL_LAYOUT = cacheLayout('jsonl');
/** Search mode's layout: LatticeDB snapshots. */
export const SNAPSHOT_LAYOUT = cacheLayout('lattice');

export const { corpusFileName, metaFileName, partialFileName, parseCorpusFileName, parseMetaFileName, parsePartialFileName } = JSONL_LAYOUT;
