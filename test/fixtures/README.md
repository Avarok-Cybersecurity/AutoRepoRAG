# fixture-vec

A miniature vector-math crate plus two GPU kernels, used as the AutoRepoRAG
chunking test corpus.

This file MUST NOT appear in any generated corpus: the test suites pass
include globs (`src/**/*.rs`, `kernels/**`) that never match `README.md`.
If a chunk with `"path":"README.md"` shows up, glob matching is broken.

## Layout

- `src/` — the Rust crate (lib, config, vector)
- `kernels/` — CUDA + Metal kernels, one generated header, one binary blob
