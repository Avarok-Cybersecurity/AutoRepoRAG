# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-10-11

Breaking: inputs only. The corpus format (`lattice-jsonl` v1, payload keys)
and the action outputs are unchanged; stating the old v1 defaults explicitly
keeps v1's chunking, precision, pacing and server version. `v1` is frozen at
1.0.0.

### Changed
- **Corpus-shaping inputs are required with no default**: `embedding-endpoint`
  (in mock mode too), `collection`, `chunk-lines`, `chunk-overlap`,
  `max-chunk-bytes`, `vector-precision`, `request-interval-ms` and
  `lattice-version`. A missing one fails the run with
  `input "<name>" is required`.
- `action.yml` is the only place defaults live: the entrypoint no longer
  carries its own fallbacks (`coderag`, `autoreporag-out`, `v0.3.3`), and
  reads plumbing inputs as required so a bare-env invocation must state them.
- `previous-corpus-url` no longer derives the meta URL from the corpus URL;
  the new `previous-corpus-meta-url` is required with it and rejected
  without it.
- Release workflow: the exact tagged tree runs the whole CI workflow, and a
  release moves its own major tag (`v2.x.y` moves `v2`) when it is the newest
  release of that major.

### Added
- `source-dir`: chunk an external git checkout (for example one made by
  `actions/checkout` at a pinned commit) instead of the workspace. Its
  `repo` / `commit_sha` come from the checkout (`git rev-parse HEAD`,
  `remote.origin.url` normalised to `owner/name`); a directory that is not
  the root of a git checkout, or whose repo or commit cannot be derived, is
  refused.
- `generate-website-chat` (required, `'true'`/`'false'`) and
  `website-chat-dir` (required iff `'true'`). This release does not ship the
  website-chat library, so `'true'` fails fast.
- README: "External sources", "Multi-corpus hosting (100 MB cap)" and
  "Migrating from v1 to v2".
- CI: unit tests (the input contract checked against `action.yml`, and
  source derivation against real git repositories), a job that builds a
  corpus of lattice-db checked out at a pinned commit and asserts every
  point carries that repo and commit, and a job asserting that a run without
  `embedding-endpoint` fails naming it.

## [1.0.0] - 2026-08-16

Promoted from 0.1.1 after the full Atlas production integration proved out
end to end: merge-to-main corpus build (5,693 chunks, dim 2048), gh-pages
publish with CORS, and in-browser retrieval on atlasinference.io.

### Changed
- No code changes since 0.1.1. This tag marks the public v1 contract:
  action inputs/outputs and the lattice-jsonl v1 output format are stable.

## [0.1.0] - 2026-08-16

### Added

- Composite GitHub Action that builds a self-verifying LatticeDB vector corpus
  (`lattice-jsonl` v1) from repository source code: glob-scoped chunking,
  live OpenRouter-compatible or deterministic mock embeddings, load + verify
  against a real pinned `lattice-server`, export corpus + `gzip -9` twin +
  metadata JSON.
- Incremental re-embedding: `previous-corpus-url` reuses vectors by
  `chunk_hash`, guarded by embedding-model and dimensionality match.
- Deterministic mock embedding mode (`mock-embeddings`) — sha256-seeded,
  L2-normalized, byte-identical corpora across runs; CI needs no secrets.
- Verification pass on every run: server `points_count`, 5-sample
  self-retrieval (cosine distance ≤ 1e-3), and scroll vector fidelity.
- Outputs: `corpus-file`, `corpus-gz-file`, `metadata-file`, `dim`, `points`,
  `embedded`, `reused`, `sha256`.

[Unreleased]: https://github.com/Avarok-Cybersecurity/AutoRepoRAG/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/Avarok-Cybersecurity/AutoRepoRAG/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Avarok-Cybersecurity/AutoRepoRAG/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/Avarok-Cybersecurity/AutoRepoRAG/releases/tag/v0.1.0
