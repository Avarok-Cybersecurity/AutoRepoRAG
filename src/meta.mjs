// meta.mjs — the corpus's <name>.meta.json (pure).
//
// Contract: v2 corpora keep exactly the v2 fields. v3 corpora add how they
// were built (chunk_strategy, search_mode, text_field, vector_index,
// vector_storage, edges) and the snapshot (snapshot_bytes, snapshot_sha256,
// snapshot_format, all null when snapshot is 'false'). A lexical corpus has
// dim 0 and no embedding model or endpoint (null).

import { textField } from './collection-v3.mjs';
import { FORMAT, FORMAT_VERSION } from './jsonl.mjs';
import { SNAPSHOT_FORMAT } from './snapshot.mjs';

/**
 * @param {{inputs: ReturnType<typeof import('./inputs.mjs').readInputs>,
 *   built: import('./corpus.mjs').BuiltCorpus, source: import('./corpus.mjs').Source,
 *   bytes: number, gzBytes: number, sha256: string, snapshotSha256: string|null,
 *   generatedAt: string, actionVersion: string}} opts
 */
export function buildMeta({ inputs, built, source, bytes, gzBytes, sha256, snapshotSha256, generatedAt, actionVersion }) {
  const lexical = built.shape?.searchMode === 'lexical';
  const meta = {
    format: FORMAT,
    version: FORMAT_VERSION,
    dim: built.dim,
    points: built.points,
    files: built.fileCount,
    embedded: built.embedded,
    reused: built.reused,
    model: built.model,
    endpoint: lexical ? null : inputs.mock ? 'mock' : inputs.endpoint,
    repo: source.repo,
    commit_sha: source.commitSha,
    generated_at: generatedAt,
    bytes,
    gz_bytes: gzBytes,
    sha256,
    action_version: actionVersion,
    lattice_version: inputs.latticeVersion,
  };
  if (!inputs.v3) return meta;
  const { shape } = built;
  const snap = built.snapshotBytes;
  return {
    ...meta,
    chunk_strategy: inputs.v3.chunkStrategy,
    search_mode: shape.searchMode,
    text_field: textField(shape),
    vector_index: shape.vectorIndex,
    vector_storage: shape.vectorStorage,
    edges: built.edges,
    snapshot_bytes: snap ? snap.length : null,
    snapshot_sha256: snap ? snapshotSha256 : null,
    snapshot_format: snap ? SNAPSHOT_FORMAT : null,
  };
}
