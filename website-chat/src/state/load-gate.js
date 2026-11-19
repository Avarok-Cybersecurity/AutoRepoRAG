// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// load-gate.js — the load state machine both modes share: one load in flight
// at a time (ensureReady), cancel from any phase (abortLoad), the visitor's
// download consent (awaitConsent / accept), failures recorded on the reactive
// `chat` object (fail), and the manifest-or-offline-copy step
// (resolveManifest). What a load DOES is the caller's: answer mode streams
// and indexes jsonl (state/loader.js), search mode installs snapshots
// (state/search-loader.js).
//
// Consent is fixed behaviour, not configuration. It holds for retries after a
// failure; closing (abortLoad) withdraws it, so the next open asks again for
// whatever is still missing.
// =============================================================================

import { manifestFaultKind } from '../core/ask-errors.js';

export class AbortedError extends Error {
  constructor() {
    super('load aborted');
    this.name = 'AbortError';
  }
}

/** A load step failed and already recorded its error kind on `chat`. */
export class FailedError extends Error {
  constructor() {
    super('load failed');
    this.name = 'FailedError';
  }
}

/**
 * @typedef {{ aborted: boolean }} LoadToken
 * @typedef {object} LoadChat  the parts of the session's $state a load writes
 * @property {string} status
 * @property {object|null} consent
 * @property {{loadedBytes: number, totalBytes: number, indexed: number, totalPoints: number}} progress
 * @property {{kind: string, message: string}|null} error
 * @property {boolean} offline
 */

/**
 * @param {LoadChat} chat
 * @param {{ cancelIo: () => void, settled: () => void }} hooks
 *   cancelIo(): abort the caller's in-flight fetch and drop its partial cache
 *   settled(): the load ended (ready, failed or aborted); drop per-load I/O handles
 */
export function createLoadGate(chat, hooks) {
  let loadPromise = null; // in-flight ensureReady(); cleared on error/abort
  let loadToken = null; // lets abortLoad() stop non-fetch phases
  let consented = false; // the visitor pressed "download" for this open
  let consentGate = null; // { resolve, reject } while waiting in 'consent'

  /** @param {LoadToken} token */
  const throwIfAborted = (token) => {
    if (token.aborted) throw new AbortedError();
  };

  function resetProgress() {
    chat.progress.loadedBytes = 0;
    chat.progress.totalBytes = 0;
    chat.progress.indexed = 0;
    chat.progress.totalPoints = 0;
  }

  /** Record a load failure of `kind`; returns the error to throw. */
  function fail(kind, err) {
    chat.status = 'error';
    chat.error = { kind, message: err?.message ? String(err.message) : String(err) };
    return new FailedError();
  }

  /**
   * Drive the machine to 'ready' with `load`. Idempotent: concurrent calls
   * share one load; re-calling after an error retries from scratch. Resolves
   * when the machine settles ('ready' or 'error' — errors are reported via
   * chat.error, not by rejecting, so callers never need their own catch).
   * @param {(token: LoadToken) => Promise<void>} load
   */
  function ensureReady(load) {
    if (chat.status === 'ready') return Promise.resolve();
    if (loadPromise) return loadPromise;

    const token = { aborted: false };
    loadToken = token;
    chat.error = null;
    chat.offline = false;
    resetProgress();
    loadPromise = load(token)
      .catch((err) => {
        // abortLoad() already restored 'idle' — not an error state.
        if (token.aborted || err?.name === 'AbortError' || err instanceof FailedError) return;
        if (!chat.error) fail('corpus', err);
      })
      .finally(() => {
        if (chat.status !== 'ready') loadPromise = null;
        if (loadToken === token) loadToken = null;
        hooks.settled();
      });
    return loadPromise;
  }

  /** Abort an in-flight load: cancel the fetch, drop any partial cache. */
  function abortLoad() {
    if (chat.status === 'ready' || chat.status === 'idle') return;
    if (loadToken) loadToken.aborted = true;
    consented = false;
    consentGate?.reject(new AbortedError());
    consentGate = null;
    chat.consent = null;
    hooks.cancelIo();
    loadPromise = null;
    chat.error = null;
    chat.offline = false;
    resetProgress();
    chat.status = 'idle';
  }

  /** The visitor pressed "download": the waiting load goes on. */
  function accept() {
    if (!consentGate) return;
    consented = true;
    chat.consent = null;
    consentGate.resolve();
    consentGate = null;
  }

  /**
   * Ask for `missing` (core/consent.js) unless this open already agreed, and
   * wait in 'consent' until accept() or abortLoad().
   * @param {LoadToken} token
   * @param {() => Promise<object|null>} missingFn  what would be downloaded
   */
  async function consentTo(token, missingFn) {
    if (consented) return;
    const missing = await missingFn();
    throwIfAborted(token);
    if (missing === null) return;
    chat.consent = missing;
    chat.status = 'consent';
    await new Promise((resolve, reject) => {
      consentGate = { resolve, reject };
    });
    throwIfAborted(token);
  }

  return { ensureReady, abortLoad, accept, consentTo, fail, throwIfAborted };
}

/**
 * The validated manifest of `corpus`. When it is unreachable or invalid, fall
 * back to the newest cached copy of that corpus (the offline path); with no
 * cached copy the load fails as 'manifest' (no response: the connection) or
 * 'unavailable' (the server's error, or an invalid meta).
 * @template M
 * @param {object} ctx
 * @param {LoadChat} ctx.chat
 * @param {{fetchMeta: (url: string) => Promise<unknown>}} ctx.net
 * @param {{newestOffline: (id: string) => Promise<{sha: string, file: Blob, rawMeta: unknown}|null>}} ctx.cache
 * @param {ReturnType<typeof createLoadGate>} ctx.gate
 * @param {(raw: unknown, id: string) => M & {commitSha: string}} ctx.validate
 * @param {LoadToken} token
 * @param {{id: string, metaUrl: string}} corpus
 * @returns {Promise<{corpus: object, raw: unknown, meta: M & {commitSha: string}, file: Blob|null}>}
 */
export async function resolveManifest({ chat, net, cache, gate, validate }, token, corpus) {
  try {
    const raw = await net.fetchMeta(corpus.metaUrl);
    return { corpus, raw, meta: validate(raw, corpus.id), file: null };
  } catch (err) {
    gate.throwIfAborted(token);
    const cached = await cache.newestOffline(corpus.id);
    gate.throwIfAborted(token);
    if (!cached) throw gate.fail(manifestFaultKind(err), err);
    let meta;
    try {
      meta = validate(cached.rawMeta, corpus.id);
    } catch {
      throw gate.fail(manifestFaultKind(err), err);
    }
    if (meta.commitSha !== cached.sha) throw gate.fail(manifestFaultKind(err), err);
    chat.offline = true;
    return { corpus, raw: cached.rawMeta, meta, file: cached.file };
  }
}
