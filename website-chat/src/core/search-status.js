// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// search-status.js — what search mode's status pill, screen-reader announcer
// and result count say. Pure. Loading states read exactly as in answer mode
// (core/status.js); the ready line names how the corpora are searched
// instead of a vector dimension, which a lexical corpus does not have.
// =============================================================================

import { shortCommit, statusText } from './status.js';
import { fill } from './template.js';

/**
 * @typedef {object} SearchChat
 * @property {string} status
 * @property {boolean} searching
 * @property {boolean} offline
 * @property {Array<{commit: string, chunks: number, plan: import('./search.js').QueryPlan}>} corpora
 * @property {{loadedBytes: number, totalBytes: number, indexed: number, totalPoints: number}} progress
 */

/**
 * @param {SearchChat} chat
 * @param {typeof import('../copy-en.js').COPY_EN} copy
 */
export function searchStatusText(chat, copy) {
  if (chat.searching) return copy.search.searching;
  if (chat.status !== 'ready' || chat.corpora.length === 0) return statusText(chat, copy, false);
  const chunks = chat.corpora.reduce((n, c) => n + c.chunks, 0);
  const which = chat.corpora.length === 1 ? shortCommit(chat.corpora[0].commit) : fill(copy.pill.corpora, { n: chat.corpora.length });
  const how = [...new Set(chat.corpora.map((c) => copy.search.plan[c.plan.kind]))].join(' + ');
  const parts = [copy.status.ready, which, fill(copy.pill.chunks, { n: chunks }), how];
  if (chat.offline) parts.push(copy.offlineBadge);
  return parts.join(' · ');
}

/** The announcer: the pill's words without running numbers (see core/status.js announceText). */
export function searchAnnounceText(chat, copy) {
  if (chat.searching || chat.status === 'ready') return searchStatusText(chat, copy);
  return copy.status[chat.status] ?? chat.status;
}

/**
 * @param {{query: string, items: unknown[]}} results
 * @param {typeof import('../copy-en.js').COPY_EN} copy
 */
export function resultsCountText(results, copy) {
  const n = results.items.length;
  if (n === 0) return fill(copy.search.empty, { query: results.query });
  return n === 1 ? fill(copy.search.countOne, { query: results.query }) : fill(copy.search.count, { n, query: results.query });
}
