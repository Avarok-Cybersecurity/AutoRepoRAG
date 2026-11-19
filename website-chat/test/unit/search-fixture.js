// SPDX-License-Identifier: Apache-2.0
// A v3 corpus manifest (the action's <name>.meta.json) for the search-mode
// unit tests; `over` replaces fields. Lexical with a snapshot by default.

export const SHA = 'c'.repeat(40);

export function rawMeta(over = {}) {
  return {
    format: 'lattice-jsonl',
    version: 1,
    dim: 0,
    points: 12,
    files: 4,
    embedded: 0,
    reused: 0,
    model: null,
    endpoint: null,
    repo: 'example-org/site',
    commit_sha: SHA,
    generated_at: '2026-11-19T00:00:00Z',
    bytes: 9000,
    gz_bytes: 3000,
    sha256: 'a'.repeat(64),
    action_version: 'v3.0.0',
    lattice_version: 'v0.5.0',
    chunk_strategy: 'markdown',
    search_mode: 'lexical',
    text_field: 'text',
    vector_index: null,
    vector_storage: null,
    edges: 11,
    snapshot_bytes: 4096,
    snapshot_sha256: 'b'.repeat(64),
    snapshot_format: 2,
    ...over,
  };
}
