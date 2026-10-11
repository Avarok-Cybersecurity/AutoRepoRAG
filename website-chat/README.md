# repo-chat — the "Talk to the Repo" website chat

A modal chat that answers questions about a repository from
[AutoRepoRAG](../README.md) corpora. Retrieval runs entirely in the browser
(LatticeDB compiled to wasm); only the embedding, rerank and answer calls go
to OpenRouter, with the visitor's own key. It ships as one ES module with the
Svelte runtime bundled (`dist/repo-chat.js`) and one stylesheet
(`dist/repo-chat.css`). Licensed Apache-2.0.

Sites get it either from the action (`generate-website-chat: 'true'`, which
also adds the verified LatticeDB wasm pair and `repo-chat.manifest.json`) or
from a release's `repo-chat-<tag>.tar.gz`. The consumer snippet is in the
[root README](../README.md#website-chat-library).

## API

```js
import { openRepoChat, warmRepoChat, COPY_EN, ConfigError } from './repo-chat.js';

const chat = openRepoChat(config); // mounts the modal in config.mount, starts loading
await chat.ready;                   // resolves when every corpus is indexed; rejects if closed first
chat.close();                       // unmounts; aborts a load in flight, keeping no partial cache

warmRepoChat(config);               // links the stylesheet, prefetches the wasm at idle; never a corpus
```

A closed chat reopened with the same corpora and provider on the same page is
ready instantly, with its conversation, the unsent question and any half-typed
key still there (the session is kept; an answer that lands while the dialog
is closed is there on reopen). `config.onReady` / `config.onClose` are
optional callbacks.

## Config

Every key is required and there are no defaults. `openRepoChat({})` throws a
single `ConfigError` whose `problems` array (and message) lists every missing
or invalid path; unknown keys are refused too.

| Key | Meaning |
|---|---|
| `mount` | The Element the chat's root `<div class="arr-root">` is appended to. |
| `assets.cssHref` | URL of `repo-chat.css`. |
| `wasm.jsUrl`, `wasm.binUrl` | URLs of `lattice_server.js` and `lattice_server_bg.wasm`. |
| `corpora[]` | `{ id, gzUrl, metaUrl }` per corpus; `id` is `[a-z0-9][a-z0-9_-]{0,63}`, unique. |
| `provider.apiUrl` | OpenRouter-compatible API base (`/embeddings`, `/rerank`, `/chat/completions`). |
| `provider.rerankModel`, `provider.chatModel` | Model ids. The visitor may switch the answer model to the paid twin of a `:free` model after a spent daily allowance. |
| `provider.appTitle`, `provider.referer` | OpenRouter attribution headers (`X-Title`, `HTTP-Referer`). |
| `provider.maxAttempts`, `provider.retryBaseMs` | Retry budget for transient failures (`retryBaseMs × 2ⁿ` backoff). A daily quota is never retried. |
| `retrieval.topK` | Sources per answer. |
| `retrieval.rerankMultiplier` | Each corpus contributes `topK × rerankMultiplier` candidates; the merged list is cut back to that many before the one rerank. |
| `retrieval.upsertBatch` | Points indexed per batch (the main thread yields between batches). |
| `storage.keyPrefix` | Prefix for `localStorage` keys (`<prefix>openrouter-key`, `<prefix>openrouter-chat-model`), OPFS files and the wasm prefetch cache. `[A-Za-z0-9._-]{1,64}`. |
| `copy` | Every key of `COPY_EN`, same types. Start from `{ ...COPY_EN }`. A `{placeholder}` may only name those `COPY_EN` uses at that path. |
| `brand.productName` | Named in the system prompt ("the code assistant for the X codebase"). |
| `brand.motifSvg` | `null` for no watermark, or a complete `<svg>…</svg>` string (trusted, site-owned markup). |
| `theme.*` | `bg bg2 card border borderStrong text text2 text3 accent accentSoft onAccent green amber fontMono fontSans shadowLg`: any CSS value, typically `var(--your-token)`. |

The embedding model is **not** configuration: it is read from each corpus's
`meta.json` (`model`), because a different embedder would not match the
vectors the corpus was built with. Corpora whose `model` or `dim` disagree
fail to load with an error naming both.

## Behaviour worth knowing

- **Nothing downloads until the modal opens.** The manifest (`meta.json`) is
  fetched first; a corpus already in OPFS for that commit is read locally.
- **OPFS layout:** `<keyPrefix>~<id>@<commit>.jsonl` plus a `.meta.json`
  sidecar. Older commits of the same corpus are pruned; other prefixes and
  other corpora are never touched.
- **Offline:** when a manifest is unreachable or invalid, the newest cached
  copy of that corpus is served and the status says `cached · offline`.
- **Theme:** the root element carries the `--arr-*` properties (set through
  CSSOM, so a strict `style-src` CSP is fine). The stylesheet derives a few
  shades from them with `color-mix()`; it contains no colour literal, and a
  unit test keeps it that way.
- **Phone:** at ≤860px the dialog is a full-bleed sheet with the input
  pinned, and source receipts start collapsed.
- **Closing is not starting over.** Only "new conversation" clears the log,
  and it leaves an undo until the next question.
- **The key is never lost to one click.** "swap key" opens a replacement form
  over the stored key, which keeps working until a new key is connected;
  "keep current key" goes back, and "forget key" removes it with an undo. The
  back and forget actions sit a full line above "connect".
- **Focus stays in the dialog.** A keyboard Ask keeps focus on the input; a
  pointer Ask moves it to the conversation (so a phone keyboard does not jump
  up over the answer); Tab from a focus that fell to the page comes back in.
  Screen readers hear each loading stage once, not every progress tick.
- **Faults name the culprit:** "no connection" when OpenRouter could not be
  reached, "rate limited" only for a transient refusal, "corpus unavailable"
  when the server answered but the corpus is not published, and a daily-limit
  reset with its time zone and the time left.

## Developing

```bash
npm ci
npm run build          # dist/ — commit it; CI fails when it is stale
npm run test:unit      # node --test: config contract, core, adapters, theme, source rules
node ../scripts/emit-website-chat.mjs v0.3.3 e2e/.site/repo-chat <cache-dir>
npx playwright test    # desktop Chromium + 390x844, against the emitted bundle
```

The browser suite serves `e2e/harness/` (a consumer page) and the emitted
bundle with `e2e/serve.mjs`; corpora (`e2e/fixtures/{code,docs}.*`, made by
`e2e/fixtures/make-corpora.mjs`) and OpenRouter are answered by Playwright
routes, so it needs no network beyond the wasm download.

Layout: `src/core/` is pure (retrieval over injected ports, prompts,
markdown, meta and jsonl parsing, status text); `src/adapters/` holds all
I/O (OpenRouter, LatticeDB wasm, OPFS, storage, corpus fetch, browser
globals); `src/state/` is the Svelte 5 runes session; `src/ui/` the
components; `src/index.js` the composition root.
