// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// copy-en.js — the English copy for the chat modal, and the copy contract.
// config.copy must carry every key below with the same type; validate.js
// enforces that, and a {placeholder} in a template string may only name the
// placeholders this file uses at the same path. Sites spread it and override
// what they need: `copy: { ...COPY_EN, starters: [...] }`.
// =============================================================================

/** Freeze a plain object tree so the shared default cannot be mutated by a caller. */
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export const COPY_EN = deepFreeze({
  navLabel: 'Ask the codebase',
  closeLabel: 'Close ask the codebase',
  label: '// ask the codebase',
  title: 'Ask the codebase.',
  sub: 'This repository is embedded into a vector lattice that runs right here in your browser. Ask a question, get an answer with file and line receipts.',
  boot: [
    'code lattice online',
    'retrieval runs locally in wasm, only the model call leaves this page',
    'pick a question or type your own',
  ],
  corpusLine: '{id}: {chunks} chunks from {files} files at {commit}',
  starters: [
    'Where does a request enter this codebase?',
    'How is configuration loaded and validated?',
    'Which modules talk to the network?',
  ],
  key: {
    tag: 'openrouter key',
    lead: 'Answers come from free models on OpenRouter, so you bring your own key. It stays in this browser and we never see it.',
    linkText: 'grab a free key at openrouter.ai/keys',
    url: 'https://openrouter.ai/keys',
    placeholder: 'sk-or-v1-...',
    inputLabel: 'OpenRouter API key',
    reveal: 'show',
    conceal: 'hide',
    save: 'connect',
    connectedTag: 'connected',
    connectedNote: 'key stored in this browser only',
    change: 'swap key',
  },
  status: {
    idle: 'standby',
    'wasm-init': 'starting engine',
    manifest: 'fetching manifest',
    'loading-cached': 'reading local cache',
    downloading: 'downloading corpus',
    caching: 'writing local cache',
    indexing: 'indexing',
    ready: 'ready',
    error: 'fault',
  },
  pill: {
    corpora: '{n} corpora',
    chunks: '{n} chunks',
    dim: 'dim {n}',
  },
  progress: {
    bytes: '{loaded} of {total} MB',
    count: '{done} of {total}',
    size: '{total} MB',
  },
  offlineBadge: 'cached · offline',
  phase: {
    retrieving: 'searching the lattice',
    reranking: 'reranking matches',
    thinking: 'reasoning',
    writing: 'writing',
  },
  trace: {
    label: 'reasoning',
    reasonedPrefix: 'reasoned for',
    show: 'show',
    hide: 'hide',
  },
  loader: {
    title: 'mounting the code lattice',
    sizeLabel: 'download',
    chunksLabel: 'chunks',
    stages: {
      'wasm-init': 'start the wasm engine',
      manifest: 'fetch the corpus manifest',
      corpus: 'load the corpus',
      indexing: 'index the chunks',
    },
    cancelNote: 'close anytime, the download cancels cleanly and nothing partial is kept',
  },
  input: {
    placeholder: 'ask about anything in the repo',
    ask: 'ask',
    hintLoading: 'the corpus is still mounting, hang tight',
    hintNoKey: 'connect your OpenRouter key above to ask',
    fine: 'answers are generated and can be wrong, the source links are real so read them before you trust them',
  },
  answerTag: 'answer',
  sourcesHeading: 'source receipts',
  sourcesOne: 'source',
  sourcesMany: 'sources',
  model: {
    label: 'answer model',
    reset: 'back to free',
  },
  errors: {
    wasm: {
      tag: 'engine fault',
      body: 'The wasm engine failed to start. Usually a one off, a retry brings it right up.',
      retry: 'restart engine',
    },
    manifest: {
      tag: 'manifest unreachable',
      body: 'Could not reach the corpus manifest. Check your connection and retry.',
      retry: 'retry',
    },
    corpus: {
      tag: 'download failed',
      body: 'The corpus download did not finish. Nothing partial was kept, retry whenever.',
      retry: 'retry download',
    },
    decompress: {
      tag: 'unpack failed',
      body: 'Your browser could not unpack the corpus stream. Any current Chrome, Edge, Firefox or Safari handles it.',
      retry: 'retry',
    },
    config: {
      tag: 'corpus mismatch',
      body: 'The published corpora do not fit together, so this site needs a rebuild. Retrying will not help.',
      retry: 'retry',
    },
    rate: {
      tag: 'rate limited',
      body: 'The free OpenRouter models are catching their breath. Give it a few seconds.',
      retry: 'ask again',
    },
    quota: {
      tag: 'daily limit reached',
      body: 'Your OpenRouter key has spent its free model allowance for today. Retrieval still runs locally so the corpus stays loaded and ready.',
      reset: 'The free pool refills at',
      paid: 'switch to the paid model and spend my own credits',
      retry: 'ask again',
    },
    key: {
      tag: 'key rejected',
      body: 'OpenRouter did not accept that key. Paste a fresh one and reconnect.',
      retry: 'swap key',
    },
    generic: {
      tag: 'hiccup',
      body: 'That one did not go through. Retry in a moment.',
      retry: 'retry',
    },
  },
});
