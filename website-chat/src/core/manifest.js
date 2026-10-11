// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// manifest.js — validation of a corpus's .meta.json (written by AutoRepoRAG)
// and of a set of corpora that must share one embedding space. Pure.
//
// The meta is a remote document, so every field the chat reads is checked
// here, once. `commit_sha` must be a hex STRING, not merely truthy: a numeric
// one used to pass, was coerced into a cache filename, and then silently
// disabled pruning (see adapters/opfs.js).
// =============================================================================

const HEX_SHA = /^[0-9a-f]{7,64}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

const isCount = (v) => Number.isSafeInteger(v) && v >= 0;

/**
 * Validate one corpus meta. Returns the fields the chat uses, renamed to
 * camelCase; throws naming the corpus and the field otherwise.
 * @param {unknown} meta
 * @param {string} corpusId
 */
export function validateMeta(meta, corpusId) {
  const bad = (what) => new Error(`corpus "${corpusId}" manifest: ${what}`);
  if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) throw bad('is not a JSON object');
  if (typeof meta.commit_sha !== 'string' || !HEX_SHA.test(meta.commit_sha)) throw bad('commit_sha must be a hex commit string');
  if (!Number.isSafeInteger(meta.dim) || meta.dim < 1) throw bad('dim must be a positive integer');
  if (typeof meta.model !== 'string' || meta.model.trim() === '') throw bad('model must name the embedding model');
  if (typeof meta.repo !== 'string' || !REPO.test(meta.repo)) throw bad('repo must be "owner/name"');
  for (const field of ['points', 'files', 'bytes', 'gz_bytes']) {
    if (!isCount(meta[field])) throw bad(`${field} must be a non-negative integer`);
  }
  if (typeof meta.generated_at !== 'string') throw bad('generated_at must be a string');
  return {
    commitSha: meta.commit_sha,
    dim: meta.dim,
    model: meta.model,
    repo: meta.repo,
    points: meta.points,
    files: meta.files,
    bytes: meta.bytes,
    gzBytes: meta.gz_bytes,
    generatedAt: meta.generated_at,
  };
}

/**
 * Every corpus is searched with ONE question embedding, so all of them must
 * have been built by the same model at the same dimensionality.
 * @param {Array<{id: string, meta: {model: string, dim: number}}>} entries
 * @returns {{model: string, dim: number}}
 */
export function sharedEmbedding(entries) {
  if (entries.length === 0) throw new Error('no corpora to load');
  const [first, ...rest] = entries;
  for (const e of rest) {
    if (e.meta.model !== first.meta.model) {
      throw new Error(
        `corpora disagree on the embedding model: "${first.id}" was built with ${first.meta.model} but ` +
          `"${e.id}" with ${e.meta.model}. One question embedding cannot search both; rebuild them with one model.`
      );
    }
    if (e.meta.dim !== first.meta.dim) {
      throw new Error(
        `corpora disagree on the embedding dimension: "${first.id}" has ${first.meta.dim} but "${e.id}" has ${e.meta.dim}.`
      );
    }
  }
  return { model: first.meta.model, dim: first.meta.dim };
}
