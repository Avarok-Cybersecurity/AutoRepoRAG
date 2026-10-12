# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2026-10-11

### Added
- **The website chat asks before its first download.** On open, when any
  configured corpus has no cached copy (OPFS) at its current commit, the
  dialog shows what would be downloaded: each missing corpus by id with its
  size, plus the search engine when it is not cached and the server reports its
  size. It also shows the total, a primary "download <size>" button, and
  "not now". Before the button is pressed, only the small `meta.json` files are
  fetched (and the engine is sized from the warm-up cache or a `HEAD`); no
  `.jsonl.gz` is requested and the wasm engine is not started. "not now" closes
  the dialog cleanly and keeps nothing. A fully cached open starts with no
  question; a partly cached one asks only for what is missing. Consent holds
  for a retry after a failed download and is withdrawn by closing. This is
  fixed behaviour, not a config switch; the config contract is unchanged.
  - Accessibility: focus lands on the "download" button, whose name carries the
    size (no live region repeats it). "not now" sits at the far end of the
    row. Both actions are full-size targets at 390×844.
  - New status `consent` ("download needed"). The loader stages now run
    manifest, then engine, then corpus, then index.
- `COPY_EN` keys: `status.consent`, `size.{kb,mb}`,
  `consent.{title,lead,engine,accept,decline}`. Sites that spread `COPY_EN` or
  merge their overrides over it get them automatically.

### Fixed
- The dialog's open effect re-ran on every load status change (it read the
  status through `ensureReady()`), which pulled focus back to the dialog each
  time. It now runs once per open.

## [2.1.1] - 2026-10-11

Website chat fixes from the UX review of its first integration (metrale.ai).
The config contract is unchanged except for new `COPY_EN` keys (listed
below): a site that spreads `COPY_EN` or merges its overrides over it gets
them automatically; a site that replaces a whole copy object must add them.

### Fixed
- **"swap key" no longer deletes the stored OpenRouter key.** It opens a
  replacement form over the stored key, which keeps working until a new key
  is connected. "keep current key" goes back; "forget key" removes the key and
  leaves an undo (the removed key is held in memory only). Both sit on the
  form's top line, away from "connect". A rejected key's "swap key" opens the
  same form instead of deleting the key.
- **Closing the dialog keeps the conversation, the unsent question and a
  half-typed key** for the rest of the page session; an answer that lands
  while the dialog is closed is there on reopen. "new conversation" clears
  the log explicitly, with an undo until the next question.
- **Focus stays in the dialog.** A keyboard Ask (or starter) keeps focus on
  the input, a pointer Ask moves it to the conversation, Tab from a focus that
  fell to the page lands on the dialog's first or last control, and focus
  moved behind the dialog comes back. The conversation is labelled and is
  `aria-busy` while an answer streams.
- **Sources toggle** is at least 24×24 CSS px (WCAG 2.2 target size).
- **Code blocks** are focusable, named scroll regions (`tabindex="0"`,
  `role="region"`, `aria-label` from `copy.codeLabel`), so a wide line can be
  scrolled from the keyboard.
- **The status announcer** says each loading stage once; the pill keeps its
  running MB and chunk counts but is no longer a live region.
- **Fault cards name the culprit:** a request that never reached OpenRouter is
  "no connection" (and is retried like a transient error), only a transient
  refusal is "rate limited", any other refusal is the generic card; a corpus
  manifest or file the server answered for with an error (or an invalid
  manifest) is "corpus unavailable", not the visitor's connection.
- **The daily-limit reset** names its time zone and the time left.
- **The connected key row** no longer wraps a word per line at 390px.

### Added
- `COPY_EN` keys: `key.swapTag`, `key.swapLead`, `key.keep`, `key.forget`,
  `key.forgotten`, `key.undo`, `conversation.{label,clear,cleared,undo}`,
  `codeLabel`, `errors.network`, `errors.unavailable`, `errors.quota.resetIn`.
- Browser suite: `@axe-core/playwright` checks the open dialog for serious or
  critical violations (WCAG 2.2 AA + best practice) in desktop Chromium and at
  390×844; new specs for keys, session persistence and focus, faults and
  accessibility.

## [2.1.0] - 2026-10-11

### Added
- **Website chat library** (`website-chat/`): the "Talk to the Repo" chat
  modal as one ES module, `openRepoChat(config)` → `{ close(), ready }`, plus
  `warmRepoChat(config)` and `COPY_EN`. Imported from Metrale/metrale.ai
  (`site/src/lib/chat`) and relicensed to Apache-2.0 by its author.
  - Every config key is required; an invalid config throws one `ConfigError`
    listing every missing or invalid path.
  - Multi-corpus: one LatticeDB collection and one OPFS cache file per corpus
    and commit; candidates from every corpus merge by cosine distance and are
    reranked once; receipts name their corpus.
  - The embedding model is read from each corpus's `meta.json`; corpora that
    disagree on model or dimension fail at load with a clear error.
  - Themed only through `--arr-*` custom properties; no colour literal in the
    library's styles (enforced by a test). No built-in watermark
    (`brand.motifSvg: null`).
- `generate-website-chat: 'true'` now emits the library, the sha256-verified
  LatticeDB wasm pair of `lattice-version` and `repo-chat.manifest.json` into
  `<output-dir>/<website-chat-dir>`; new output `website-chat-dir`.
- Releases attach `repo-chat-<tag>.tar.gz` and its `.sha256`.
- CI: a `website-chat` job (lockfile install, stale-dist check, byte-stable
  rebuild, unit tests, Playwright in desktop Chromium and at 390×844 against
  the emitted bundle with fixture corpora and a mocked OpenRouter).

### Changed
- `website-chat-dir` is now relative to `output-dir` (it was documented as
  workspace-relative while unused) and may not be absolute, escape
  `output-dir`, or be `output-dir` itself.
- Release-asset checksums are verified in Node (`src/checksum.mjs`, exact
  basename match) instead of `grep | sha256sum -c`.

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
