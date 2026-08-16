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
  uses: Avarok-Cybersecurity/AutoRepoRAG@v1
  with:
    paths: |
      src/**/*.rs
      src/**/*.ts
    embedding-model: nvidia/llama-nemotron-embed-vl-1b-v2:free
    embedding-api-key: ${{ secrets.OPENROUTER_API_KEY }}

- run: echo "Built ${{ steps.rag.outputs.points }} points at dim ${{ steps.rag.outputs.dim }}"
```

No secrets? Use mock mode — same pipeline, deterministic vectors:

```yaml
- uses: Avarok-Cybersecurity/AutoRepoRAG@v1
  with:
    paths: |
      src/**/*.rs
    mock-embeddings: 'true'
```

Runs on `ubuntu-latest` and `ubuntu-24.04-arm` (Linux x64/arm64 runners; the
pinned `lattice-server` release binaries target Linux).

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `paths` | **yes** | — | Newline-separated include globs (`**` / `*` / `?` and `{a,b}`), relative to the repository root. |
| `exclude` | no | `''` | Newline-separated exclude globs applied after `paths`. |
| `collection` | no | `coderag` | LatticeDB collection name recorded in the corpus header. |
| `output-dir` | no | `autoreporag-out` | Directory (relative to the workspace) where corpus, gzip and metadata are written. |
| `output-name` | no | `coderag` | Basename for outputs (`<name>.jsonl`, `<name>.jsonl.gz`, `<name>.meta.json`). |
| `gzip` | no | `true` | Also write a `gzip -9` twin of the corpus. |
| `embedding-endpoint` | no | `https://openrouter.ai/api/v1` | OpenAI-compatible embeddings API base URL (`POST <endpoint>/embeddings`). |
| `embedding-model` | no | `''` | Embedding model id. Required unless `mock-embeddings` is true. |
| `embedding-api-key` | no | `''` | API key for the embedding endpoint. Masked immediately; required unless `mock-embeddings` is true. |
| `mock-embeddings` | no | `false` | Use deterministic sha256-seeded L2-normalized mock vectors (CI needs no secrets). |
| `mock-dim` | no | `256` | Vector dimensionality in mock mode. |
| `chunk-lines` | no | `90` | Lines per chunk window. |
| `chunk-overlap` | no | `15` | Lines of overlap between consecutive chunks (stride = `chunk-lines` − `chunk-overlap`). |
| `max-chunk-bytes` | no | `16384` | Hard byte cap per chunk text (UTF-8). |
| `batch-size` | no | `32` | Texts per embeddings request. |
| `request-interval-ms` | no | `2500` | Minimum milliseconds between embeddings request starts (free-tier pacing). |
| `max-retries` | no | `3` | Attempts per embeddings request (`700ms × 2ⁿ` backoff on transient failures). |
| `max-chunks` | no | `0` | Upper bound on chunks (`0` = unlimited); truncates with a warning. |
| `vector-precision` | no | `6` | Significant digits vectors are rounded to (then f32-cast) before upsert and export. |
| `previous-corpus-url` | no | `''` | `file://` or `http(s)://` URL of a previously published corpus (`.jsonl` or `.jsonl.gz`) for incremental reuse by `chunk_hash`; its sibling `.meta.json` must declare the same model, and dims must match, else the cache is discarded with a warning. |
| `lattice-version` | no | `v0.3.3` | Pinned lattice-db release tag whose `lattice-server` binary is downloaded and sha256-verified. |
| `lattice-port` | no | `6334` | Loopback port for the throwaway `lattice-server`. |

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

## Scenarios

| Scenario | Trigger | Secrets | Key inputs | Example |
|---|---|---|---|---|
| **CI self-test** | any | none | `mock-embeddings: 'true'` | this repo's [`ci.yml`](.github/workflows/ci.yml) |
| **PR dry run** | `pull_request` | none | `mock-embeddings: 'true'` — proves chunking/corpus still build, fork-safe | [`examples/mock-ci.yml`](examples/mock-ci.yml) |
| **Merge-to-main publish** | `push: main` | embedding key | `embedding-model`, `embedding-api-key`, publish step after | [`examples/basic.yml`](examples/basic.yml), [`examples/publish-pages.yml`](examples/publish-pages.yml) |
| **Incremental refresh** | `push: main` | embedding key | `previous-corpus-url` pointing at the last published corpus | [`examples/publish-pages.yml`](examples/publish-pages.yml) |

The action deliberately does **not** upload artifacts or publish anywhere —
your workflow composes that (see [Hosting the corpus](#hosting-the-corpus)),
so the corpus can go to artifacts, Pages, releases, or your own bucket.

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

## Rate limits & incremental refresh

A first full run on a mid-sized repo is a few hundred embedding requests
(`ceil(chunks / batch-size)`), paced by `request-interval-ms` (default 2.5 s
between request starts — sized for free-tier endpoints; ~9,000 chunks ≈ 300
requests ≈ 15–20 minutes). Transient failures (HTTP 429/5xx **and**
200-with-error bodies, common on saturated free tiers) retry up to
`max-retries` times with `700ms × 2ⁿ` backoff.

After the first publish, pass `previous-corpus-url` pointing at the published
corpus. Vectors are reused by `chunk_hash`, so steady-state runs embed **only
chunks whose content changed** — typically a handful of requests per merge.
Guardrails, all fail-safe to a full re-embed with a warning:

- the previous corpus's sibling `.meta.json` must declare the **same model**;
- dimensionality must match (also re-checked against the first live response);
- an unreachable/corrupt previous corpus is simply discarded.

Budget levers: `chunk-lines` (bigger chunks → fewer requests),
`vector-precision` (smaller corpus file), `max-chunks` (hard cap),
`request-interval-ms` (pacing).

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

- **`@v1` is a moving major tag**: every `v1.x.y` release re-points it
  (semver-compatible changes only). Pin the full commit SHA if you want
  absolute immutability: `uses: Avarok-Cybersecurity/AutoRepoRAG@<sha> # v1.x.y`.
- **`lattice-version` is pinned** (default `v0.3.3`) and the downloaded server
  binary is sha256-verified — a new lattice-db release can never silently
  change your corpus. A weekly canary in this repo's CI runs against the
  newest lattice-db release to catch drift early.
- **Format guarantee**: within action v1, the corpus stays `lattice-jsonl`
  format version 1 with the documented payload keys. A corpus format break
  means a new action major version.

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

1. `node --check src/*.mjs` must pass (CI lints every `.mjs` and workflow).
2. Run the mock e2e locally: the action is plain Node — no build step.
3. Keep the zero-dependency rule: no `package.json`, no `node_modules`.
4. `CHANGELOG.md` follows Keep a Changelog — add your entry under
   `[Unreleased]`.
