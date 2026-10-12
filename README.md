# AutoRepoRAG

[![CI](https://github.com/Avarok-Cybersecurity/AutoRepoRAG/actions/workflows/ci.yml/badge.svg)](https://github.com/Avarok-Cybersecurity/AutoRepoRAG/actions/workflows/ci.yml)
[![Release](https://github.com/Avarok-Cybersecurity/AutoRepoRAG/actions/workflows/release.yml/badge.svg)](https://github.com/Avarok-Cybersecurity/AutoRepoRAG/actions/workflows/release.yml)
[![GitHub Marketplace](https://img.shields.io/badge/marketplace-AutoRepoRAG-6f42c1?logo=github)](https://github.com/marketplace/actions/autoreporag)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Turn your repository into a ready-to-query vector corpus, straight from CI.
AutoRepoRAG chunks your source code, embeds it (against any OpenAI-compatible
embeddings endpoint, or with deterministic mock vectors that need no secrets),
loads and **verifies** every vector against a real, checksum-pinned
[LatticeDB](https://github.com/Avarok-Cybersecurity/lattice-db) server, and
exports a byte-deterministic [`lattice-jsonl`](#output-format) corpus — plus a
gzip twin and a metadata manifest — that a browser, a bot, or another pipeline
can consume directly. Zero npm dependencies, no Docker, no build step: a
composite action running vendored Node ESM.

```
  repo files                                            outputs
 ┌───────────┐   ┌────────┐   ┌───────────┐   ┌──────────────────────┐
 │ paths     │──▶│ chunk  │──▶│ embed     │──▶│ load + VERIFY        │
 │ globs     │   │ 90-line│   │ live API  │   │ real lattice-server  │
 └───────────┘   │ windows│   │ or mock   │   │ · points_count       │
                 └────────┘   └─────┬─────┘   │ · self-retrieval     │
                                    │         │ · scroll fidelity    │
                 ┌──────────────────┘         └──────────┬───────────┘
                 │  reuse by chunk_hash                   │
                 │  (previous-corpus-url)                 ▼
                 │                            ┌──────────────────────┐
                 └───────────────────────────▶│ corpus.jsonl         │
                                              │ corpus.jsonl.gz      │
                                              │ corpus.meta.json     │
                                              └──────────────────────┘
```

## Quick start

```yaml
- uses: actions/checkout@v7

- name: Build code corpus
  id: rag
  uses: Avarok-Cybersecurity/AutoRepoRAG@v2
  with:
    paths: |
      src/**/*.rs
      src/**/*.ts
    embedding-endpoint: https://openrouter.ai/api/v1
    embedding-model: nvidia/llama-nemotron-embed-vl-1b-v2:free
    embedding-api-key: ${{ secrets.OPENROUTER_API_KEY }}
    collection: coderag
    chunk-lines: '90'
    chunk-overlap: '15'
    max-chunk-bytes: '16384'
    vector-precision: '6'
    request-interval-ms: '2500'
    lattice-version: v0.3.3
    generate-website-chat: 'false'

- run: echo "Built ${{ steps.rag.outputs.points }} points at dim ${{ steps.rag.outputs.dim }}"
```

Every input that shapes the corpus is required and has no default (see
[Inputs](#inputs)): a corpus records exactly what produced it, and two
corpora are only comparable when the same values were stated for both.

No secrets? Use mock mode — same pipeline, deterministic vectors. It still
states the corpus-shaping inputs, so a dry run chunks exactly like the real
publish:

```yaml
- uses: Avarok-Cybersecurity/AutoRepoRAG@v2
  with:
    paths: |
      src/**/*.rs
    mock-embeddings: 'true'
    embedding-endpoint: https://openrouter.ai/api/v1
    collection: coderag
    chunk-lines: '90'
    chunk-overlap: '15'
    max-chunk-bytes: '16384'
    vector-precision: '6'
    request-interval-ms: '2500'
    lattice-version: v0.3.3
    generate-website-chat: 'false'
```

Runs on `ubuntu-latest` and `ubuntu-24.04-arm` (Linux x64/arm64 runners; the
pinned `lattice-server` release binaries target Linux).

## Inputs

**Required, no default** — these shape the corpus. The action fails at once
with `input "<name>" is required` when one is missing (GitHub does not enforce
`required` for composite actions; the action does).

| Input | Description |
|---|---|
| `paths` | Newline-separated include globs (`**` / `*` / `?` and `{a,b}`), relative to the source root (`source-dir`, or the workspace). |
| `embedding-endpoint` | OpenAI-compatible embeddings API base URL (`POST <endpoint>/embeddings`). Required in mock mode too. |
| `collection` | LatticeDB collection name recorded in the corpus header. |
| `chunk-lines` | Lines per chunk window. |
| `chunk-overlap` | Lines of overlap between consecutive chunks (stride = `chunk-lines` − `chunk-overlap`). |
| `max-chunk-bytes` | Hard byte cap per chunk text (UTF-8). |
| `vector-precision` | Significant digits vectors are rounded to (then f32-cast) before upsert and export. |
| `request-interval-ms` | Minimum milliseconds between embeddings request starts (free-tier pacing). |
| `lattice-version` | Pinned lattice-db release tag (e.g. `v0.3.3`) whose `lattice-server` binary is downloaded and sha256-verified. |
| `generate-website-chat` | `'true'` or `'false'`. `'true'` emits the [website chat library](#website-chat-library) into `<output-dir>/<website-chat-dir>`. |

**Conditionally required** — required when their condition holds, and
rejected when it does not (a silently ignored input is a misconfiguration).

| Input | Required when | Description |
|---|---|---|
| `embedding-model` | `mock-embeddings` is false | Embedding model id. |
| `embedding-api-key` | `mock-embeddings` is false | API key for the embedding endpoint. Masked immediately. |
| `previous-corpus-meta-url` | `previous-corpus-url` is set | `file://` or `http(s)://` URL of that corpus's `.meta.json`. It must declare the same model, and dims must match, else the cache is discarded with a warning. |
| `website-chat-dir` | `generate-website-chat` is `'true'` | Directory for the website-chat library, relative to `output-dir`; not absolute, not outside it, not `output-dir` itself. |

**Optional** — plumbing with defaults declared once, in `action.yml`.

| Input | Default | Description |
|---|---|---|
| `source-dir` | `''` | Workspace-relative directory holding an external git checkout to chunk instead of the workspace — see [External sources](#external-sources-source-dir). `''` = the workspace. |
| `exclude` | `''` | Newline-separated exclude globs applied after `paths`. |
| `output-dir` | `autoreporag-out` | Directory (relative to the workspace) where corpus, gzip and metadata are written. |
| `output-name` | `coderag` | Basename for outputs (`<name>.jsonl`, `<name>.jsonl.gz`, `<name>.meta.json`). |
| `gzip` | `true` | Also write a `gzip -9` twin of the corpus. |
| `mock-embeddings` | `false` | Use deterministic sha256-seeded L2-normalized mock vectors (CI needs no secrets). |
| `mock-dim` | `256` | Vector dimensionality in mock mode. |
| `batch-size` | `32` | Texts per embeddings request. |
| `max-retries` | `3` | Attempts per embeddings request (`700ms × 2ⁿ` backoff on transient failures). |
| `max-chunks` | `0` | Upper bound on chunks (`0` = unlimited); truncates with a warning. |
| `previous-corpus-url` | `''` | `file://` or `http(s)://` URL of a previously published corpus (`.jsonl` or `.jsonl.gz`) for incremental reuse by `chunk_hash`. Requires `previous-corpus-meta-url`. |
| `lattice-port` | `6334` | Loopback port for the throwaway `lattice-server`. |

## Outputs

| Output | Description |
|---|---|
| `corpus-file` | Absolute path of the written lattice-jsonl corpus. |
| `corpus-gz-file` | Absolute path of the gzip twin (empty when `gzip` is false). |
| `metadata-file` | Absolute path of the metadata JSON. |
| `dim` | Vector dimensionality of the corpus. |
| `points` | Number of points in the corpus. |
| `embedded` | Chunks embedded fresh this run. |
| `reused` | Chunks whose vectors were reused from `previous-corpus-url`. |
| `sha256` | sha256 of the raw corpus file. |
| `website-chat-dir` | Absolute path of the emitted website-chat bundle (empty when `generate-website-chat` is `'false'`). |

## Scenarios

| Scenario | Trigger | Secrets | Key inputs | Example |
|---|---|---|---|---|
| **CI self-test** | any | none | `mock-embeddings: 'true'` | this repo's [`ci.yml`](.github/workflows/ci.yml) |
| **PR dry run** | `pull_request` | none | `mock-embeddings: 'true'` — proves chunking/corpus still build, fork-safe | [`examples/mock-ci.yml`](examples/mock-ci.yml) |
| **Merge-to-main publish** | `push: main` | embedding key | `embedding-model`, `embedding-api-key`, publish step after | [`examples/basic.yml`](examples/basic.yml), [`examples/publish-pages.yml`](examples/publish-pages.yml) |
| **Incremental refresh** | `push: main` | embedding key | `previous-corpus-url` + `previous-corpus-meta-url` pointing at the last published corpus | [`examples/publish-pages.yml`](examples/publish-pages.yml) |

The action deliberately does **not** upload artifacts or publish anywhere —
your workflow composes that (see [Hosting the corpus](#hosting-the-corpus)),
so the corpus can go to artifacts, Pages, releases, or your own bucket.

## External sources (`source-dir`)

To build a corpus of a repository other than the one running the workflow
(a dependency, a docs site, a book), check it out at a pinned commit and point
`source-dir` at it:

```yaml
- uses: actions/checkout@v7
- uses: actions/checkout@v7
  with:
    repository: rust-lang/book
    ref: <full commit sha>        # pin it: the corpus records this commit
    path: .sources/rust-book
    persist-credentials: false

- uses: Avarok-Cybersecurity/AutoRepoRAG@v2
  with:
    source-dir: .sources/rust-book
    paths: |
      src/**/*.md
    output-name: books-rust
    # ...the required inputs, with a prose chunk profile
```

`paths` are then relative to `source-dir`, and every chunk's `repo` and
`commit_sha` come from that checkout: `git rev-parse HEAD` and
`remote.origin.url` (https and ssh forms are normalised to `owner/name`).
The workflow's own `GITHUB_REPOSITORY` / `GITHUB_SHA` are ignored, since they
describe a different repository. The action refuses a `source-dir` that is
absolute, escapes the workspace, is not the root of a git checkout (a plain
subdirectory of your repo would silently inherit your repo's identity), has
no commit, or has no `origin` remote it can parse.

## Output format

The corpus is [`lattice-jsonl` v1](https://github.com/Avarok-Cybersecurity/lattice-db)
— LatticeDB's line-oriented interchange format. One JSON object per line, every
object's keys sorted lexicographically at every nesting level, header first,
points ascending by id. The output is **byte-deterministic**: identical inputs
(in mock mode) produce an identical file, byte for byte.

Line 1 — header:

```json
{"config":{"durability":"ephemeral","hnsw":{"ef":100,"ef_construction":200,"m":16,"m0":32,"ml":0.36067376022224085},"name":"coderag","relations":{},"vectors":{"distance":"cosine","size":256}},"dim":256,"edges":0,"format":"lattice-jsonl","points":412,"t":"header","version":1,"vectors":"inline"}
```

Every following line — one point per chunk:

```json
{"id":1,"payload":{"chunk_hash":"b1946ac92492d2347c6235b4d2611184e2c8f861…","commit_sha":"da56736dc8e0f2c9b3a41c26f6b0a9f4c8f0e2ab","end_line":90,"language":"rust","path":"src/scheduler/mod.rs","repo":"your-org/your-repo","start_line":1,"text":"//! Scheduler entry points.\nuse crate::…"},"t":"point","vector":[0.0123456,-0.0987654,0.0456789]}
```

- `id` — ordinal in `(path asc, start_line asc)` order, starting at 1.
- `chunk_hash` — `sha256(path \0 start_line \0 text)`; the identity used for
  incremental reuse.
- `text` — the chunk content itself, so consumers can build LLM context
  without re-fetching files; `path`/`start_line`/`end_line` give you exact
  source links (`blob/<commit_sha>/<path>#L<start>-L<end>`).
- Vectors are rounded to `vector-precision` significant digits and f32-cast
  **before both** server upsert and export, so the file and a live DB agree
  exactly.

The `.meta.json` manifest carries `format`, `version`, `dim`, `points`,
`files`, `embedded`, `reused`, `model`, `endpoint`, `repo`, `commit_sha`,
`generated_at`, `bytes`, `gz_bytes`, `sha256`, `action_version`,
`lattice_version` — fetch this tiny file first as a preflight (cache key,
download size, dim check) before pulling the corpus.

### Consuming from a browser

The corpus round-trips into LatticeDB's WASM build. Note the WASM API has **no
import binding**, so parse the lines and upsert in batches yourself:

```js
import { LatticeDB } from 'https://avarok-cybersecurity.github.io/lattice-db/js/lattice-db.esm.js';

const db = await LatticeDB.init('https://avarok-cybersecurity.github.io/lattice-db/wasm/lattice_server_bg.wasm');

const res = await fetch('https://your-org.github.io/your-repo/coderag/coderag.jsonl.gz');
const text = await new Response(
  res.body.pipeThrough(new DecompressionStream('gzip')),
).text();

const lines = text.split('\n').filter(Boolean);
const header = JSON.parse(lines[0]);
await db.createCollection('coderag', header.dim);

let batch = [];
for (const line of lines.slice(1)) {
  const obj = JSON.parse(line);
  if (obj.t !== 'point') continue;
  batch.push({ id: obj.id, vector: obj.vector, payload: obj.payload });
  if (batch.length === 256) { await db.upsert('coderag', batch); batch = []; }
}
if (batch.length) await db.upsert('coderag', batch);

const hits = await db.search('coderag', queryVector, 5);
// ⚠ `score` is a cosine DISTANCE, not a similarity: 0.0 = identical,
// lower = closer. Do not expect "score ≈ 1.0" for good matches.
```

## Website chat library

`generate-website-chat: 'true'` writes a ready-to-host "Talk to the Repo"
chat into `<output-dir>/<website-chat-dir>/`, next to your corpus:

| File | What it is |
|---|---|
| `repo-chat.js` | The library: one ES module, Svelte runtime bundled, no dependencies. |
| `repo-chat.css` | Its stylesheet. Every colour and font is a `--arr-*` property set from your `theme`. |
| `lattice_server.js`, `lattice_server_bg.wasm` | The LatticeDB wasm build of `lattice-version`, downloaded from that release and verified against its `lattice-db-wasm.sha256`. |
| `repo-chat.manifest.json` | `library_version`, `lattice_version` and the sha256 of every file above. No timestamp: the same inputs give the same bytes. |

Retrieval runs in the visitor's browser (LatticeDB in wasm, one collection
per corpus, cached in OPFS per commit); the question embedding, the rerank
and the answer come from OpenRouter with the visitor's own key, kept in
their browser. Each release also attaches the same bundle as
`repo-chat-<tag>.tar.gz` (one `repo-chat-<tag>/` directory) with a
`.sha256`, for sites that vendor it instead of building a corpus.

Host the bundle on your own origin (it is CSP-friendly: no inline styles or
scripts, theme values are applied through CSSOM) and open it with one call.
Import it lazily so nothing loads until the visitor asks:

```js
const BASE = '/repo-chat/2.2.0/';
let lib;
const load = () => (lib ??= import(`${BASE}repo-chat.js`));

// Every key is required; openRepoChat({}) throws one error listing them all.
const config = (COPY_EN) => ({
  mount: document.body,
  assets: { cssHref: `${BASE}repo-chat.css` },
  wasm: { jsUrl: `${BASE}lattice_server.js`, binUrl: `${BASE}lattice_server_bg.wasm` },
  corpora: [
    { id: 'code', gzUrl: 'https://your-org.github.io/your-repo/coderag/code.jsonl.gz', metaUrl: 'https://your-org.github.io/your-repo/coderag/code.meta.json' },
    { id: 'docs', gzUrl: 'https://your-org.github.io/your-repo/coderag/docs.jsonl.gz', metaUrl: 'https://your-org.github.io/your-repo/coderag/docs.meta.json' },
  ],
  provider: {
    apiUrl: 'https://openrouter.ai/api/v1',
    rerankModel: 'nvidia/llama-nemotron-rerank-vl-1b-v2:free',
    chatModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    appTitle: 'Your Project: Ask the Codebase',
    referer: 'https://your.site',
    maxAttempts: 3,
    retryBaseMs: 700,
  },
  retrieval: { topK: 3, rerankMultiplier: 4, upsertBatch: 256 },
  storage: { keyPrefix: 'your-site-' },
  copy: { ...COPY_EN, starters: ['Where does a request enter the server?'] },
  brand: { productName: 'Your Project', motifSvg: null },
  theme: {
    bg: 'var(--bg)', bg2: 'var(--bg2)', card: 'var(--card)', border: 'var(--border)',
    borderStrong: 'var(--border-strong)', text: 'var(--text)', text2: 'var(--text-2)', text3: 'var(--text-3)',
    accent: 'var(--accent)', accentSoft: 'var(--accent-soft)', onAccent: 'var(--on-accent)',
    green: 'var(--green)', amber: 'var(--amber)', fontMono: 'ui-monospace, monospace',
    fontSans: 'system-ui, sans-serif', shadowLg: '0 18px 50px rgba(0, 0, 0, 0.5)',
  },
});

button.addEventListener('pointerenter', async () => {
  const { warmRepoChat, COPY_EN } = await load();
  warmRepoChat(config(COPY_EN)); // stylesheet + idle wasm prefetch, never a corpus
});
button.addEventListener('click', async () => {
  const { openRepoChat, COPY_EN } = await load();
  const chat = openRepoChat(config(COPY_EN)); // { close(), ready }
});
```

- The embedding model is not configuration: it is read from each corpus's
  `meta.json`, and corpora built with different models or dimensions refuse
  to load with a message naming both.
- Several corpora are searched with one question embedding (each returns
  `topK × rerankMultiplier` candidates), merged by cosine distance, cut back
  to that many, and reranked once; each source receipt names its corpus.
- The corpora must be served with CORS (GitHub Pages is). See
  [`website-chat/README.md`](website-chat/README.md) for the full config
  reference, the theme keys and how to build and test the library.

## Rate limits & incremental refresh

A first full run on a mid-sized repo is a few hundred embedding requests
(`ceil(chunks / batch-size)`), paced by `request-interval-ms` (2500 ms
between request starts suits free-tier endpoints; ~9,000 chunks ≈ 300
requests ≈ 15–20 minutes). Transient failures (HTTP 429/5xx **and**
200-with-error bodies, common on saturated free tiers) retry up to
`max-retries` times with `700ms × 2ⁿ` backoff.

After the first publish, pass `previous-corpus-url` pointing at the published
corpus and `previous-corpus-meta-url` pointing at its `.meta.json`. Vectors are reused by `chunk_hash`, so steady-state runs embed **only
chunks whose content changed** — typically a handful of requests per merge.
Guardrails, all fail-safe to a full re-embed with a warning:

- the `.meta.json` at `previous-corpus-meta-url` must declare the **same model**;
- dimensionality must match (also re-checked against the first live response);
- an unreachable/corrupt previous corpus is simply discarded.

Budget levers: `chunk-lines` (bigger chunks → fewer requests),
`vector-precision` (smaller corpus file), `max-chunks` (hard cap),
`request-interval-ms` (pacing).

## Multi-corpus hosting (100 MB cap)

GitHub rejects any single pushed file over **100 MB**, and a Pages site may
be at most **1 GB** in total. Treat the per-file cap as the binding one and
build **one corpus per source** rather than one ever-growing file:

| Corpus | `source-dir` | `output-name` | Chunk profile |
|---|---|---|---|
| your code | `''` | `code` | code windows (e.g. 90 / 15 lines) |
| your docs | `''` (with `paths: docs/**`) | `docs` | prose windows |
| a book or dependency | `.sources/<name>` | `books-<name>` | prose windows |

- Give each corpus its own `output-name` and its own
  `previous-corpus-url` / `previous-corpus-meta-url` pair, so each reuses
  only its own vectors.
- Fail the publish before the cap, not at it. Leave headroom for growth:

  ```bash
  max=$((95 * 1024 * 1024))
  size=$(stat -c %s "$CORPUS_GZ")
  [ "$size" -le "$max" ] || { echo "::error::$CORPUS_GZ is $size B (> 95 MiB)"; exit 1; }
  ```

- Lower `vector-precision` (e.g. `4`) to shrink a large code corpus; vectors
  dominate the file size.
- Publish every corpus in the **same** job when you force-push an orphan
  `gh-pages` branch: that push replaces the whole site, so a corpus built in
  another job would be deleted. Corpora built on different schedules (a book
  rebuilt only when its pin moves) should instead check out the current
  `gh-pages` tree and replace only their own files.
- A browser client loads each corpus into its own collection (or one
  collection with distinct ids per corpus) and merges results by distance.

## Hosting the corpus

Where you publish determines who can fetch it — a browser app needs CORS:

| Host | Browser CORS | Lifetime | Notes |
|---|---|---|---|
| **GitHub Pages** (orphan `gh-pages`) | ✅ `Access-Control-Allow-Origin: *` | no TTL | Best for web apps: stable URL, free, served gzip-friendly. |
| **Release assets** | ❌ no CORS headers | permanent | Great for CLI/server consumers via `releases/latest/download/…`; not fetchable from browser JS. |
| **Actions artifacts** | ❌ auth required | ≤ 90 days | CI-internal handoff only (API token needed to download). |

The Pages pattern — merge to main → build incrementally → force-push a
single-commit orphan `gh-pages` branch — is exactly
[`examples/publish-pages.yml`](examples/publish-pages.yml). One-time setup:
repo **Settings → Pages → Deploy from a branch → `gh-pages` / root**. Your
corpus then lives at a stable, CORS-open URL:

```
https://<owner>.github.io/<repo>/coderag/coderag.jsonl.gz
https://<owner>.github.io/<repo>/coderag/coderag.meta.json
```

## Versioning

- **`@v2` is a moving major tag**: every `v2.x.y` release re-points it, as
  long as it is the newest `v2` release (semver-compatible changes only). Pin
  the full commit SHA if you want absolute immutability:
  `uses: Avarok-Cybersecurity/AutoRepoRAG@<sha> # v2.x.y`.
- **`@v1` is frozen** at `v1.0.0` and receives no further changes.
- **`lattice-version` is yours to pin** (`v0.3.3` is the version this
  action's CI uses) and the downloaded server binary is sha256-verified — a
  new lattice-db release can never silently change your corpus. A weekly
  canary in this repo's CI runs against the newest lattice-db release to
  catch drift early.
- **Format guarantee**: the corpus stays `lattice-jsonl` format version 1
  with the documented payload keys (unchanged from v1). A corpus format break
  means a new action major version.

## Migrating from v1 to v2

v2 changes the inputs only; the corpus format and the outputs are unchanged.

1. Change `@v1` to `@v2`.
2. State every input that used to have a default and now does not. These
   are the v1 defaults; stating them keeps v1's chunking, precision, pacing
   and server version:

   ```yaml
   embedding-endpoint: https://openrouter.ai/api/v1
   collection: coderag
   chunk-lines: '90'
   chunk-overlap: '15'
   max-chunk-bytes: '16384'
   vector-precision: '6'
   request-interval-ms: '2500'
   lattice-version: v0.3.3
   generate-website-chat: 'false'
   ```

3. If you use `previous-corpus-url`, add `previous-corpus-meta-url`. v1
   derived it from the corpus URL (`<name>.jsonl.gz` → `<name>.meta.json`);
   v2 reads only the URL you give it.
4. Nothing else changes for a workflow that chunks its own repository. The
   new `source-dir` input is opt-in.

## Security

See [SECURITY.md](SECURITY.md). In short: the embedding key crosses only via
env, is masked immediately, and is never persisted to any output; the
`lattice-server` binary is release-pinned + checksum-verified and listens on
loopback only; the action has zero npm dependencies; report vulnerabilities to
**security@avarok.com**.

## License

[Apache-2.0](LICENSE) © 2026 Avarok Cybersecurity.

## Contributing

Issues and PRs welcome. Before opening a PR:

1. `node --check src/*.mjs` and `node --test test/unit/*.test.mjs` must pass
   (CI lints every `.mjs` and workflow and runs the unit tests).
2. Run the mock e2e locally (`scripts/local-dry-run.sh`): the action is plain
   Node — no build step.
3. Keep the zero-dependency rule for the action: no root `package.json`,
   no runtime `node_modules`. The website chat under `website-chat/` has
   build-time devDependencies only (Svelte, Vite, Playwright) and ships as
   the committed `website-chat/dist/`; CI rebuilds it and fails on any
   difference, so run `npm ci && npm run build` there after changing it.
4. `CHANGELOG.md` follows Keep a Changelog — add your entry under
   `[Unreleased]`.
