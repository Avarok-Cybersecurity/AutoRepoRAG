// SPDX-License-Identifier: Apache-2.0
// The harness is a consumer site: it imports the EMITTED bundle (what the
// action writes and a release tarball ships), builds a complete config, and
// opens the chat with one call. Query parameters pick the variant under test:
//   ?corpora=code,docs   which fixture corpora to load (default: code)

import { COPY_EN, openRepoChat, warmRepoChat } from '/repo-chat/repo-chat.js';
import { THEME } from './theme.js';

const params = new URLSearchParams(location.search);
const ids = (params.get('corpora') ?? 'code').split(',');

export const config = {
  mode: 'answer',
  mount: document.body,
  assets: { cssHref: '/repo-chat/repo-chat.css' },
  wasm: { jsUrl: '/repo-chat/lattice_server.js', binUrl: '/repo-chat/lattice_server_bg.wasm' },
  corpora: ids.map((id) => ({ id, gzUrl: `https://corpus.test/${id}.jsonl.gz`, metaUrl: `https://corpus.test/${id}.meta.json` })),
  provider: {
    apiUrl: 'https://openrouter.ai/api/v1',
    rerankModel: 'nvidia/llama-nemotron-rerank-vl-1b-v2:free',
    chatModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    appTitle: 'repo-chat e2e',
    referer: 'https://harness.test',
    maxAttempts: 3,
    // The suite asserts attempt COUNTS; a 1 ms backoff keeps it fast.
    retryBaseMs: 1,
  },
  retrieval: { topK: 3, rerankMultiplier: 4, upsertBatch: 256 },
  storage: { keyPrefix: 'arr-e2e-' },
  copy: {
    ...COPY_EN,
    starters: [
      'How does MTP speculative decoding pick which draft tokens to keep?',
      'Where does the scheduler decide which requests join a decode batch?',
      'How do the NVFP4 GEMM kernels get dispatched on GB10?',
    ],
  },
  brand: { productName: 'Example Engine', motifSvg: null },
  theme: THEME,
};

// What the suite reads back: lifecycle callbacks, and the module itself.
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
