// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// search-meta.js — validation of a corpus's .meta.json for search mode. Pure.
// Search mode installs the corpus's LatticeDB snapshot (<name>.lattice), so
// it reads the v3 fields the action writes beside the jsonl ones: how the
// corpus can be searched (search_mode, model, dim) and the snapshot's size,
// checksum and format. The meta is a remote document: every field read is
// checked here, once. A corpus published without a snapshot validates with
// `snapshot: null`; core/search.js planFor() refuses it with the reason, so
// the visitor sees a "rebuild with snapshot: true" diagnosis, not a 404.
// =============================================================================

const HEX_SHA = /^[0-9a-f]{7,64}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SEARCH_MODES = ['lexical', 'vector', 'hybrid'];

const isCount = (v) => Number.isSafeInteger(v) && v >= 0;

/**
 * @typedef {object} SearchMeta
 * @property {string} commitSha
 * @property {string} repo
 * @property {number} points
 * @property {number} files
 * @property {string} generatedAt
 * @property {'lexical'|'vector'|'hybrid'} searchMode
 * @property {string|null} model  the embedding model; null when lexical
 * @property {number} dim          0 when lexical
 * @property {{bytes: number, sha256: string, format: number}|null} snapshot
 */

/**
 * Validate one corpus meta for search mode; throws naming the corpus and the
 * field otherwise.
 * @param {unknown} meta
 * @param {string} corpusId
 * @returns {SearchMeta}
 */
export function validateSearchMeta(meta, corpusId) {
  const bad = (what) => new Error(`corpus "${corpusId}" manifest: ${what}`);
  if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) throw bad('is not a JSON object');
  const m = /** @type {Record<string, unknown>} */ (meta);
  if (typeof m.commit_sha !== 'string' || !HEX_SHA.test(m.commit_sha)) throw bad('commit_sha must be a hex commit string');
  if (typeof m.repo !== 'string' || !REPO.test(m.repo)) throw bad('repo must be "owner/name"');
  for (const field of ['points', 'files']) {
    if (!isCount(m[field])) throw bad(`${field} must be a non-negative integer`);
  }
  if (typeof m.generated_at !== 'string') throw bad('generated_at must be a string');
  if (!SEARCH_MODES.includes(/** @type {string} */ (m.search_mode))) throw bad(`search_mode must be one of ${SEARCH_MODES.join(', ')}`);
  const searchMode = /** @type {'lexical'|'vector'|'hybrid'} */ (m.search_mode);
  const dense = searchMode !== 'lexical';
  if (dense && (typeof m.model !== 'string' || m.model.trim() === '')) throw bad(`model must name the embedding model of a ${searchMode} corpus`);
  if (!isCount(m.dim) || (dense && m.dim < 1)) throw bad(`dim must be ${dense ? 'a positive' : 'a non-negative'} integer`);
  return {
    commitSha: m.commit_sha,
    repo: m.repo,
    points: /** @type {number} */ (m.points),
    files: /** @type {number} */ (m.files),
    generatedAt: m.generated_at,
    searchMode,
    model: dense ? /** @type {string} */ (m.model) : null,
    dim: /** @type {number} */ (m.dim),
    snapshot: snapshotOf(m, bad),
  };
}

/**
 * The three snapshot_* fields are all null (the action ran with snapshot
 * false) or all valid; anything in between is a broken manifest.
 * @param {Record<string, unknown>} m
 * @param {(what: string) => Error} bad
 * @returns {{bytes: number, sha256: string, format: number}|null}
 */
function snapshotOf(m, bad) {
  const fields = [m.snapshot_bytes, m.snapshot_sha256, m.snapshot_format];
  if (fields.every((v) => v === null || v === undefined)) return null;
  if (!Number.isSafeInteger(m.snapshot_bytes) || /** @type {number} */ (m.snapshot_bytes) < 1) throw bad('snapshot_bytes must be a positive integer');
  if (typeof m.snapshot_sha256 !== 'string' || !SHA256.test(m.snapshot_sha256)) throw bad('snapshot_sha256 must be 64 lowercase hex characters');
  if (!Number.isSafeInteger(m.snapshot_format) || /** @type {number} */ (m.snapshot_format) < 1) throw bad('snapshot_format must be a positive integer');
  return { bytes: /** @type {number} */ (m.snapshot_bytes), sha256: m.snapshot_sha256, format: /** @type {number} */ (m.snapshot_format) };
}
