# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/Avarok-Cybersecurity/AutoRepoRAG/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Avarok-Cybersecurity/AutoRepoRAG/releases/tag/v0.1.0
