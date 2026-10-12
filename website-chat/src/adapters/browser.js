// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// browser.js — the remaining browser globals the chat touches: frame and
// idle scheduling, the clock, media queries, the stylesheet link and the
// idle wasm prefetch. The composition root (index.js) is the only importer.
// =============================================================================

/**
 * Yield the main thread between upsert batches so indexing never holds a long
 * task. Uses requestIdleCallback when present, else a macrotask.
 */
export function idleYield() {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), { timeout: 100 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const clock = {
  now: () => performance.now(),
  // Wall-clock epoch ms, for comparing against server stamps (a quota reset).
  epochMs: () => Date.now(),
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (id) => cancelAnimationFrame(id),
};

export const matches = (query) => typeof window !== 'undefined' && window.matchMedia(query).matches;

/** Fetch through whatever window.fetch is at call time (never a stale copy). */
export const fetchNow = (input, init) => globalThis.fetch(input, init);

export const importModule = (url) => import(/* @vite-ignore */ url);

export const opfsDirectory = () =>
  typeof navigator !== 'undefined' && navigator.storage?.getDirectory ? () => navigator.storage.getDirectory() : null;

/**
 * Make sure `href` is linked as a stylesheet exactly once. Resolves when it
 * has loaded (immediately when an earlier call already loaded it); rejects
 * when it fails to load, so a broken assets.cssHref is loud, not unstyled.
 */
export function ensureStylesheet(href) {
  const existing = [...document.querySelectorAll('link[rel="stylesheet"][data-repo-chat]')].find((l) => l.getAttribute('href') === href);
  if (existing?.dataset.repoChat === 'loaded') return Promise.resolve();
  const link = existing ?? document.createElement('link');
  const settled = new Promise((resolve, reject) => {
    link.addEventListener('load', () => {
      link.dataset.repoChat = 'loaded';
      resolve();
    }, { once: true });
    link.addEventListener('error', () => reject(new Error(`stylesheet ${href} failed to load`)), { once: true });
  });
  if (!existing) {
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.repoChat = 'pending';
    document.head.appendChild(link);
  }
  return settled;
}

// Respect constrained connections: never spend a visitor's metered/slow
// bandwidth on a speculative wasm fetch.
function connectionAllowsPrefetch() {
  const conn = typeof navigator !== 'undefined' ? navigator.connection : undefined;
  if (!conn) return true;
  if (conn.saveData) return false;
  if (typeof conn.effectiveType === 'string' && /(^|-)2g$/.test(conn.effectiveType)) return false;
  return true;
}

/**
 * How many bytes the wasm binary still has to come down: 0 when the warm-up
 * prefetch already holds it in `cacheName`, else the Content-Length of a HEAD
 * request (no body is transferred), or null when the server does not say.
 * Both lookups are best-effort sizing for the consent step: a failure means
 * "size unknown" (null), never a failed load.
 */
export async function wasmDownloadBytes(binUrl, cacheName) {
  try {
    if (typeof caches !== 'undefined' && (await caches.match(binUrl, { cacheName }))) return 0;
  } catch {
    // Cache Storage unavailable (e.g. an opaque origin): fall through to HEAD.
  }
  try {
    const res = await fetch(binUrl, { method: 'HEAD' });
    const length = Number(res.headers.get('content-length'));
    return res.ok && Number.isFinite(length) && length > 0 ? length : null;
  } catch {
    return null;
  }
}

const prefetched = new Set();

/**
 * Idle-time, low-priority prefetch of the wasm binary so the modal's
 * wasm-init phase is warm. The corpus NEVER downloads here: no corpus bytes
 * until the modal opens. Best-effort: any failure is swallowed and allows a
 * later retry.
 */
export function prefetchWasmOnIdle(binUrl, cacheName) {
  if (prefetched.has(binUrl)) return;
  if (typeof window === 'undefined' || typeof caches === 'undefined') return;
  if (!connectionAllowsPrefetch()) return;
  prefetched.add(binUrl);

  const run = async () => {
    try {
      const cache = await caches.open(cacheName);
      if (await cache.match(binUrl)) return;
      const res = await fetch(binUrl, { priority: 'low' });
      if (res.ok) await cache.put(binUrl, res);
    } catch {
      // Best-effort only — the modal load path fetches the wasm itself.
      prefetched.delete(binUrl);
    }
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => void run(), { timeout: 4000 });
  } else {
    setTimeout(() => void run(), 2000);
  }
}
