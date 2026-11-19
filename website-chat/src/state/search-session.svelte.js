// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// search-session.svelte.js — one search-mode session (Svelte 5 runes): the
// reactive state the search dialog renders, the snapshot load
// (state/search-loader.js) and running a search. No key, no model, no
// answer: retrieval only. Built from a validated config and its ports at
// openRepoChat() time; it outlives the dialog, so the last query and its
// results are still there on reopen.
// =============================================================================

import { searchCorpora } from '../core/search-results.js';
import { createSearchLoader } from './search-loader.js';

/**
 * @param {object} config  a validated search-mode openRepoChat config
 * @param {object} ports   { search, cache, net, wasmBytes, sha256, reportCacheFault }
 */
export function createSearchSession(config, ports) {
  const chat = $state({
    status: 'idle', // as answer mode: 'idle'|'manifest'|'consent'|'wasm-init'|'loading-cached'|'downloading'|'indexing'|'ready'|'error'
    consent: null, // while status is 'consent' (core/consent.js)
    progress: { loadedBytes: 0, totalBytes: 0, indexed: 0, totalPoints: 0 },
    corpora: [], // [{ id, collection, commit, repo, files, chunks, plan, generatedAt }] once ready
    offline: false,
    error: null, // a load fault: { kind, message }
    draft: '', // the query being typed; survives a close and reopen
    searching: false,
    results: null, // { query, items: SearchResult[] } of the last search that finished
    searchError: null, // { message } when the last search failed
  });

  const loader = createSearchLoader({ chat, corpora: config.corpora, embedder: config.search.embedder, ports });

  // A newer search supersedes an older one still in flight: only the latest writes.
  let latest = 0;

  /**
   * Search the ready corpora for `text`. Returns false when there is nothing
   * to run (blank text, or not ready); otherwise resolves once the results
   * (or a searchError) are on `chat`.
   * @param {string} text
   */
  async function search(text) {
    const query = String(text ?? '').trim();
    if (query === '' || chat.status !== 'ready') return false;
    const mine = ++latest;
    chat.searching = true;
    chat.searchError = null;
    try {
      const items = await searchCorpora(query, {
        query: ports.search.query,
        corpora: chat.corpora,
        topK: config.search.topK,
        snippetChars: config.search.snippetChars,
      });
      if (mine === latest) chat.results = { query, items };
    } catch (err) {
      if (mine === latest) chat.searchError = { message: err?.message ? String(err.message) : String(err) };
    } finally {
      if (mine === latest) chat.searching = false;
    }
    return true;
  }

  return {
    chat,
    search,
    ensureReady: loader.ensureReady,
    abortLoad: loader.abortLoad,
    acceptDownload: loader.accept,
  };
}
