// SPDX-License-Identifier: Apache-2.0
// A complete, valid openRepoChat config for the unit tests. `mount` is a
// duck-typed Element: validate.js is pure and never touches the DOM.

import { COPY_EN } from '../../src/copy-en.js';

export function validConfig() {
  return {
    mount: { nodeType: 1, appendChild() {} },
    assets: { cssHref: '/repo-chat/repo-chat.css' },
    wasm: { jsUrl: '/repo-chat/lattice_server.js', binUrl: '/repo-chat/lattice_server_bg.wasm' },
    corpora: [
      { id: 'code', gzUrl: 'https://example.test/code.jsonl.gz', metaUrl: 'https://example.test/code.meta.json' },
      { id: 'docs', gzUrl: 'https://example.test/docs.jsonl.gz', metaUrl: 'https://example.test/docs.meta.json' },
    ],
    provider: {
      apiUrl: 'https://openrouter.ai/api/v1',
      rerankModel: 'rerank/model:free',
      chatModel: 'chat/model:free',
      appTitle: 'Example Ask the Codebase',
      referer: 'https://example.test',
      maxAttempts: 3,
      retryBaseMs: 700,
    },
    retrieval: { topK: 3, rerankMultiplier: 4, upsertBatch: 256 },
    storage: { keyPrefix: 'example-' },
    copy: COPY_EN,
    brand: { productName: 'Example Engine', motifSvg: null },
    theme: {
      bg: 'var(--bg)',
      bg2: 'var(--bg2)',
      card: 'var(--card)',
      border: 'var(--border)',
      borderStrong: 'var(--border-strong)',
      text: 'var(--t1)',
      text2: 'var(--t2)',
      text3: 'var(--t3)',
      accent: 'var(--accent)',
      accentSoft: 'var(--accent-soft)',
      onAccent: 'var(--on-accent)',
      green: 'var(--green)',
      amber: 'var(--amber)',
      fontMono: 'var(--font-mono)',
      fontSans: 'var(--font-sans)',
      shadowLg: 'var(--shadow-lg)',
    },
  };
}
