// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// repo-chat — the "Talk to the Repo" website chat, as one call.
//
//   const chat = openRepoChat(config);   // mounts the modal, starts loading
//   await chat.ready;                     // corpora indexed (rejects if closed first)
//   chat.close();
//
//   warmRepoChat(config);                 // on hover/focus: stylesheet + idle wasm prefetch
//
// This file is the composition root: it validates the config, binds every
// adapter to it, and mounts the UI. Nothing below it reads a global constant.
// A session is reused while the page lives, so a closed-then-reopened chat
// with the same corpora and provider is instantly ready again, with its
// conversation and drafts intact.
// =============================================================================

import { mount, unmount } from 'svelte';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/log.css';
import './styles/controls.css';
import './styles/viewport.css';
import { validateConfig } from './config/validate.js';
import { COPY_EN } from './copy-en.js';
import { themeDeclarations } from './core/theme.js';
import {
  clock,
  ensureStylesheet,
  fetchNow,
  idleYield,
  importModule,
  matches,
  opfsDirectory,
  prefetchWasmOnIdle,
  sleep,
  wasmDownloadBytes,
} from './adapters/browser.js';
import { createCorpusNet } from './adapters/corpus.js';
import { createLattice } from './adapters/lattice.js';
import { createOpenRouter } from './adapters/openrouter.js';
import { createOpfsCache } from './adapters/opfs.js';
import { createKeyStore } from './adapters/storage.js';
import { createSession } from './state/session.svelte.js';
import RepoChat from './ui/RepoChat.svelte';

export { COPY_EN };
export { ConfigError } from './config/validate.js';

// Sheets on a phone, a centered dialog elsewhere; sources start collapsed on
// the phone. Kept in step with the breakpoint in styles/viewport.css.
const PHONE_QUERY = '(max-width: 860px)';

const sessions = new Map();

/** The Cache Storage name the warm-up prefetch keeps the wasm binary in. */
const wasmCacheName = (cfg) => `${cfg.storage.keyPrefix}lattice-wasm`;

/** What makes two configs share one loaded session. */
function sessionKey(cfg) {
  return JSON.stringify([cfg.corpora, cfg.wasm, cfg.provider, cfg.retrieval, cfg.storage.keyPrefix, cfg.brand.productName]);
}

function sessionFor(cfg) {
  const key = sessionKey(cfg);
  let session = sessions.get(key);
  if (!session) {
    const io = { fetch: fetchNow, sleep };
    session = createSession(cfg, {
      openrouter: createOpenRouter(cfg.provider, io),
      lattice: createLattice(cfg.wasm, { importModule, fetch: fetchNow }),
      cache: createOpfsCache(cfg.storage.keyPrefix, { getDirectory: opfsDirectory() }),
      net: createCorpusNet({ fetch: fetchNow }),
      keys: createKeyStore(cfg.storage.keyPrefix, window.localStorage),
      clock,
      idleYield,
      wasmBytes: () => wasmDownloadBytes(cfg.wasm.binUrl, wasmCacheName(cfg)),
    });
    sessions.set(key, session);
  }
  return session;
}

function requireBrowser(what) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error(`${what} runs in a browser only`);
  }
}

/**
 * Warm the chat before it is opened: link the stylesheet and prefetch the
 * wasm binary at idle priority. Never downloads a corpus. Safe to call on
 * every hover/focus.
 */
export function warmRepoChat(config) {
  const cfg = validateConfig(config);
  requireBrowser('warmRepoChat');
  ensureStylesheet(cfg.assets.cssHref).catch(() => {});
  prefetchWasmOnIdle(cfg.wasm.binUrl, wasmCacheName(cfg));
}

/**
 * Open the chat modal inside config.mount and start loading the corpora.
 * Throws a ConfigError listing every problem when the config is invalid.
 * @returns {{ close: () => void, ready: Promise<void> }}
 */
export function openRepoChat(config) {
  const cfg = validateConfig(config);
  requireBrowser('openRepoChat');

  const host = document.createElement('div');
  host.className = 'arr-root';
  // CSSOM, not a style attribute: works under a strict style-src CSP.
  for (const [name, value] of themeDeclarations(cfg.theme)) host.style.setProperty(name, value);

  let settleReady;
  const ready = new Promise((resolve, reject) => {
    settleReady = { resolve, reject };
  });
  // The caller may never await `ready`; closing early must not surface as an
  // unhandled rejection. Awaiting callers still see the rejection.
  ready.catch(() => {});

  let app = null;
  let isReady = false;
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    // Cancel-safe from any caller: a load in flight is aborted and its
    // partial cache dropped (a no-op once ready or idle).
    session.abortLoad();
    if (app) unmount(app);
    host.remove();
    if (!isReady) settleReady.reject(new Error('the chat was closed before its corpora were ready'));
    cfg.onClose?.();
  }

  const session = sessionFor(cfg);
  cfg.mount.appendChild(host);
  ensureStylesheet(cfg.assets.cssHref)
    .catch((err) => {
      // An unstyled modal is worse than a loud failure: say so, still open.
      console.error(err);
    })
    .then(() => {
      if (closed) return;
      app = mount(RepoChat, {
        target: host,
        props: {
          session,
          copy: cfg.copy,
          brand: cfg.brand,
          sourcesOpen: !matches(PHONE_QUERY),
          reducedMotion: () => matches('(prefers-reduced-motion: reduce)'),
          onclose: close,
          onready: () => {
            if (isReady) return;
            isReady = true;
            settleReady.resolve();
            cfg.onReady?.();
          },
        },
      });
    });

  return { close, ready };
}
