// SPDX-License-Identifier: Apache-2.0
// The search-mode consumer page (served at /search). Query parameters pick
// the variant under test:
//   ?corpora=site,guide   which fixture snapshots to load (default: site)
//   ?embedder=1           pass search.embedder (the shared fake embedder,
//                         8-d), so hybrid corpora fuse BM25 with vectors
// It vendors the bundle emitted with lattice-db v0.5.0 (/repo-chat-search/,
// see e2e/serve.mjs): search mode needs that release's wasm.

import { COPY_EN, openRepoChat, warmRepoChat } from '/repo-chat-search/repo-chat.js';
import { embedText } from '/fixtures/embed.mjs';
import { THEME } from './theme.js';

const params = new URLSearchParams(location.search);
const ids = (params.get('corpora') ?? 'site').split(',');

// What the suite reads back: every batch of texts the engine asked to embed.
window.__embedCalls = [];
const embedder = {
  model: 'test/embed-8',
  dim: 8,
  embed: async (texts) => {
    window.__embedCalls.push(texts);
    return texts.map((t) => embedText(t, 8));
  },
};

export const config = {
  mode: 'search',
  mount: document.body,
  assets: { cssHref: '/repo-chat-search/repo-chat.css' },
  wasm: { jsUrl: '/repo-chat-search/lattice_server.js', binUrl: '/repo-chat-search/lattice_server_bg.wasm' },
  corpora: ids.map((id) => ({ id, snapshotUrl: `https://corpus.test/${id}.lattice`, metaUrl: `https://corpus.test/${id}.meta.json` })),
  search: { topK: 5, snippetChars: 160, embedder: params.get('embedder') === '1' ? embedder : null },
  storage: { keyPrefix: 'arr-e2e-' },
  copy: COPY_EN,
  brand: { motifSvg: null },
  theme: THEME,
};

window.__events = [];
window.__repoChat = { openRepoChat, warmRepoChat, config, COPY_EN };

const button = document.querySelector('.open-chat');
const warm = () => warmRepoChat(config);
button.addEventListener('pointerenter', warm);
button.addEventListener('focus', warm);
button.addEventListener('click', () => {
  window.__handle = openRepoChat({
    ...config,
    onReady: () => window.__events.push('ready'),
    onClose: () => window.__events.push('close'),
  });
});
