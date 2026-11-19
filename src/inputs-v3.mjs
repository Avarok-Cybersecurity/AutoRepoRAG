// inputs-v3.mjs — the v3 (site corpus) inputs.
//
// Contract: pure, like src/inputs.mjs. v3 mode is on when ANY input in
// V3_INPUTS is non-empty; action.yml declares each with '' so an unset one is
// recognisable. In v3 mode chunk-strategy, search-mode and snapshot are
// required; the rest are required or refused by those choices, never
// silently ignored. Every failure names the input.

import { relativeInside } from './paths.mjs';
import { getBoolInput, getInput, getIntInput } from './util.mjs';

export const V3_INPUTS = Object.freeze([
  'files-dir', 'corpus-repo', 'corpus-commit', 'chunk-strategy', 'payload-sidecar', 'edges-file',
  'search-mode', 'vector-index', 'vector-storage', 'snapshot', 'max-snapshot-bytes',
]);

export const CHUNK_STRATEGIES = Object.freeze(['lines', 'markdown']);
export const SEARCH_MODES = Object.freeze(['lexical', 'vector', 'hybrid']);
export const VECTOR_INDEXES = Object.freeze(['hnsw', 'flat']);
export const VECTOR_STORAGES = Object.freeze(['f32', 'f16', 'int8']);

const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const COMMIT = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;

/** `dependentName` is required iff `condition` holds; set otherwise it would be silently ignored. */
export function requiredIff(dependentName, dependentValue, condition, conditionText) {
  if (condition && !dependentValue) {
    throw new Error(`input "${dependentName}" is required when ${conditionText}`);
  }
  if (!condition && dependentValue) {
    throw new Error(`input "${dependentName}" is only valid when ${conditionText}; refusing to ignore it`);
  }
}

/** Refuse a set input that the chosen mode would ignore. */
export function refuse(env, name, conditionText) {
  if (getInput(env, name)) {
    throw new Error(`input "${name}" is only valid when ${conditionText}; refusing to ignore it`);
  }
}

function oneOf(env, name, allowed, why) {
  const value = getInput(env, name);
  if (!value) throw new Error(`input "${name}" is required ${why}`);
  if (!allowed.includes(value)) {
    throw new Error(`input "${name}" must be one of ${allowed.map((a) => JSON.stringify(a)).join(', ')}, got ${JSON.stringify(value)}`);
  }
  return value;
}

/**
 * @param {Record<string, string|undefined>} env  INPUT_* map
 * @returns {null | {filesDir: string, corpusRepo: string, corpusCommit: string,
 *   chunkStrategy: 'lines'|'markdown', payloadSidecar: string, edgesFile: string,
 *   searchMode: 'lexical'|'vector'|'hybrid', vectorIndex: 'hnsw'|'flat'|null,
 *   vectorStorage: 'f32'|'f16'|'int8'|null, snapshot: boolean, maxSnapshotBytes: number|null}}
 *   null in v2 mode (no v3 input set)
 */
export function readV3Inputs(env) {
  const trigger = V3_INPUTS.find((name) => getInput(env, name) !== '');
  if (!trigger) return null;
  const why = `in v3 mode (on because ${trigger} is set)`;
  const chunkStrategy = oneOf(env, 'chunk-strategy', CHUNK_STRATEGIES, why);
  const searchMode = oneOf(env, 'search-mode', SEARCH_MODES, why);
  if (!getInput(env, 'snapshot')) throw new Error(`input "snapshot" is required ${why}`);
  const snapshot = getBoolInput(env, 'snapshot');

  let filesDir = getInput(env, 'files-dir');
  const corpusRepo = getInput(env, 'corpus-repo');
  const corpusCommit = getInput(env, 'corpus-commit');
  requiredIff('corpus-repo', corpusRepo, Boolean(filesDir), 'files-dir is set');
  requiredIff('corpus-commit', corpusCommit, Boolean(filesDir), 'files-dir is set');
  if (filesDir) {
    if (getInput(env, 'source-dir')) throw new Error('files-dir and source-dir are mutually exclusive; set one');
    filesDir = relativeInside(filesDir, 'files-dir', 'workspace');
    if (!REPO.test(corpusRepo)) throw new Error(`input "corpus-repo" must be "owner/name", got ${JSON.stringify(corpusRepo)}`);
    if (!COMMIT.test(corpusCommit)) {
      throw new Error(`input "corpus-commit" must be a full 40- or 64-hex commit id, got ${JSON.stringify(corpusCommit)}`);
    }
  }

  const vectors = searchMode !== 'lexical';
  const vectorWhy = 'when search-mode is "vector" or "hybrid"';
  let vectorIndex = null;
  let vectorStorage = null;
  if (vectors) {
    vectorIndex = oneOf(env, 'vector-index', VECTOR_INDEXES, vectorWhy);
    vectorStorage = oneOf(env, 'vector-storage', VECTOR_STORAGES, vectorWhy);
  } else {
    const text = 'search-mode is "vector" or "hybrid"';
    for (const name of ['vector-index', 'vector-storage', 'embedding-endpoint', 'embedding-model', 'embedding-api-key',
      'vector-precision', 'request-interval-ms', 'previous-corpus-url', 'previous-corpus-meta-url']) {
      refuse(env, name, text);
    }
    if (getBoolInput(env, 'mock-embeddings')) refuse(env, 'mock-embeddings', text);
  }

  const maxSnapshot = getInput(env, 'max-snapshot-bytes');
  requiredIff('max-snapshot-bytes', maxSnapshot, snapshot, 'snapshot is "true"');
  return {
    filesDir,
    corpusRepo,
    corpusCommit,
    chunkStrategy,
    payloadSidecar: getInput(env, 'payload-sidecar'),
    edgesFile: getInput(env, 'edges-file'),
    searchMode,
    vectorIndex,
    vectorStorage,
    snapshot,
    maxSnapshotBytes: snapshot ? getIntInput(env, 'max-snapshot-bytes', { min: 1 }) : null,
  };
}
