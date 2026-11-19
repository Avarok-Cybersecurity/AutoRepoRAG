# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - Unreleased

Site corpora: the corpus behind a website's search. Needs lattice-db
>= v0.5.1. v2 runs (no v3 input set) behave as before; their corpora are
byte-identical to 2.2.1's.

### Added
- **v3 mode**, on when any v3 input is set; it requires `chunk-strategy`,
  `search-mode` and `snapshot`, and `lattice-version` >= v0.5.1 (pinned).
- **`files-dir`** chunks a plain directory (a site's gitignored `dist/`)
  without asking git; repo and commit come from **`corpus-repo`** and
  **`corpus-commit`**.
- **`chunk-strategy: markdown`**: split at ATX headings with a
  `heading_path` per chunk; long sections split between paragraphs, never
  inside fenced code, tables or front matter; a `next` edge between
  consecutive chunks of a file.
- **`payload-sidecar`** merges per-file payload fields (e.g. `url`, `title`,
  `lastmod`); unknown paths and fields the action writes are errors.
- **`edges-file`**: graph edges by path and chunk index, written as
  lattice-jsonl edge lines (header `edges` and `config.relations` set;
  relation ids in name order, as lattice-db numbers them in a snapshot).
- **`search-mode: lexical | vector | hybrid`**: lexical makes no embedding
  call and builds a BM25 `text_index` with no `vectors`; hybrid has both.
  **`vector-index: hnsw | flat`** and **`vector-storage: f32 | f16 | int8`**;
  stored vectors are checked against the local ones within that rounding,
  and the corpus carries the stored values. `embedding.model` is recorded in
  the collection config.
- **`snapshot`** exports `<name>.lattice` (snapshot format 2), checked to
  carry the jsonl header's exact config, then round-tripped natively (dropped,
  imported with `import?mode=create`; `points_count`, a probe query's hits
  and scores, and a re-export's bytes must match). Snapshots are
  byte-reproducible: identical runs give the same `snapshot_sha256`.
  **`max-snapshot-bytes`** fails a
  larger snapshot naming both sizes. meta.json gains `chunk_strategy`,
  `search_mode`, `text_field`, `vector_index`, `vector_storage`, `edges`,
  `snapshot_bytes`, `snapshot_sha256`, `snapshot_format`. New outputs
  `snapshot-file` and `edges`.
- **Cloudflare Workers AI** via its OpenAI-compatible endpoint, documented
  and tested: the `{success: false, errors}` envelope is read, 3036 (daily
  allocation) is not retried, 3040 (capacity) and 408 are.
- **lattice-db v0.5.0 and v0.5.1 assets are pinned** (`src/pins.mjs`): the server
  archives for linux/macOS x64/arm64 and the wasm pair must match both the
  release's checksum file and the sha256 pinned here.
- **macOS runners**: the `lattice-db-macos-{x64,arm64}` release binaries are
  used there.
- `test/integration/site.test.mjs`: the whole action on `fixtures/site` with
  the v0.5.1 release, the snapshot loaded in the v0.5.1 wasm build, BM25
  ranking, the native round-trip and snapshot determinism checked; CI job `e2e-site-v3` (`.github/workflows/site-v3.yml`, called by `ci.yml`) also runs the composite action.

- **website-chat 3.0.0: search mode.** `mode: 'search'` is retrieval-only
  site search over v3 snapshots (BM25, no API key), with hybrid ranking when
  the site supplies an embedder; several corpora merge by rank (RRF). Snapshots
  are checked against `snapshot_sha256` before they are installed, cached in
  OPFS, and downloaded only after consent. Needs the lattice-db >= v0.5.0
  wasm. See `website-chat/README.md`.

### Changed
- **website-chat: `mode` is a required config key** (`'answer'` or
  `'search'`). Existing configs add `mode: 'answer'`.
- `embedding-endpoint`, `vector-precision`, `request-interval-ms`,
  `chunk-lines` and `chunk-overlap` are declared optional in `action.yml`:
  v3 lexical / markdown runs refuse them. v2 runs still fail naming each
  one when it is missing.
- An embeddings response whose items carry no `index` keeps response order;
  one where only some do is refused.
- `src/main.mjs` is a thin entry over `src/run.mjs`, which takes the
  lattice-server provisioner as a parameter; `src/adapters/server.mjs`
  splits download (`fetchServerBinary`) from start (`startServer`).
- **The pipeline's business logic does no I/O itself (SBIO).** Every file,
  network, git, clock and GitHub-runner access goes through one `io` port
  that `src/main.mjs` (the composition root) builds from the node adapter
  `src/adapters/node-io.mjs`. Everything that touches the outside world now
  lives under `src/adapters/` (lattice REST client, server provisioner,
  website-chat emitter, checksum files, git, file listing, clock, step
  outputs); the rest of `src/` receives the port or plain data. Unit tests
  run the chunker and the previous-corpus loader on in-memory data.
- **`GITHUB_WORKSPACE` and `RUNNER_TEMP` are required absolute paths**
  (`src/run-config.mjs`). They used to fall back to the cwd and
  `<workspace>/.work`; a run without them now fails naming the variable. The
  GitHub runner always sets both; a local run must export them
  (`scripts/local-dry-run.sh` and the integration suite already do).
- **An absent `INPUT_*` variable is an error naming the input.** The runner
  maps every input `action.yml` declares (an ungiven one arrives as `''`,
  which still means "not given"), so an absent variable means the code and
  `action.yml` disagree. A unit test checks that the inputs `src/` reads and
  the inputs `action.yml` declares are the same set. To run `src/main.mjs`
  outside Actions, wrap it in `scripts/run-as-action.mjs`, which fills every
  input you leave unset from `action.yml` as the runner does; the unit tests,
  `local-dry-run.sh` and the CI missing-input step use it.
- **Logging goes through a facade** (`src/log.mjs`): `log` and `warning`
  hand lines to the sink the entrypoint installs (stdout, via
  `src/adapters/stdout-log.mjs`). Logging before a sink is installed
  throws instead of dropping `::warning::` lines.
- The core's ports are declared in `src/ports.mjs` (`Io`, `LatticeStore`,
  `Clock`). The core names those types and never the adapters
  that implement them.

## [2.2.1] - 2026-10-11

Website chat fixes from the third UX review round of its metrale.ai
integration. The config contract is unchanged.

### Fixed
- **The focus trap holds in WebKit.** WebKit does not focus a clicked button,
  so after a pointer Ask, focus sat on the dialog container, and the first
  Option+Tab walked out of the dialog. The trap now moves focus itself on
  Tab, Shift+Tab and their Option/Alt forms, from any start: a control, the
  container, a region inside it, or a focus that fell to the page
  (`ui/focus-trap.js`).
- **An OpenRouter 5xx is a "service error"**, not "rate limited". This covers
  an HTTP 5xx, or a 5xx code in an error body or stream chunk. It is distinct
  from a 429 rate limit and from an unreachable OpenRouter ("no connection"),
  and it is still retried.
- **The consent question is read before its action.** Focus lands on the
  consent panel, which is named by its question and described by the sizes;
  "download <size>" is the next Tab.
- **Sizes are decimal SI.** 1 KB is 10^3 bytes and 1 MB is 10^6 bytes, as
  downloads and sites report them: 134,217,728 bytes reads "134.2 MB", no
  longer "128.0 MB". This applies to the consent panel, the loader and the
  download progress.
- **The consent panel states what the browser keeps** ("… to download, about
  … kept in this browser"), from each missing corpus's decompressed `bytes`.
- **A failed download no longer leaves a file in the browser.** This was the
  cause of the flaky corrupt-gzip test.
  - Root cause: Chromium releases a writable's lock asynchronously. The
    `removeEntry` that `discard()` ran right after `abort()` failed with
    `NoModificationAllowedError` (8 of 60 runs on Linux). The error was
    swallowed, so the empty file `create:true` had made stayed under the
    corpus's cache name.
  - Downloads are now written to `<name>.jsonl.part` and moved to the cache
    name only after the whole stream has parsed (atomic commit).
  - Removal and the commit move retry that one error with a short backoff.
    Any other failure is thrown as a `CacheCleanupError` and reported through
    a new loader port (`console.error`) instead of being swallowed. The same
    applies to pruning old commits and a writer that cannot be set up.
  - A successful load also sweeps the corpus's leftover `.part` files.

### Added
- `COPY_EN` keys `errors.service.{tag,body,retry}` and `consent.total`
  (`{download}` and `{stored}`).
- Browser suite: a desktop WebKit project that runs the focus-trap spec. CI
  now installs WebKit next to Chromium.

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
