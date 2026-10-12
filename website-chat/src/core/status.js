// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// status.js — what the status pill, the loader stages and the progress bar
// say for a given machine state. Pure: (chat snapshot, copy) -> text/numbers.
// =============================================================================

import { fill } from './template.js';

export const LOADING_STATUSES = Object.freeze(['wasm-init', 'manifest', 'loading-cached', 'downloading', 'caching', 'indexing']);
const STAGE_ORDER = ['manifest', 'wasm-init', 'corpus', 'indexing'];

export const mb = (bytes) => (bytes / 1048576).toFixed(1);

export const shortCommit = (sha) => String(sha).slice(0, 7);

function bytesText(copy, p) {
  return fill(copy.progress.bytes, { loaded: mb(p.loadedBytes), total: mb(p.totalBytes) });
}

function countText(copy, p) {
  return fill(copy.progress.count, { done: p.indexed, total: p.totalPoints });
}

/**
 * The pill has limited width and ellipsizes from the right, so it carries
 * only the segments not shown elsewhere (file counts live in the welcome
 * lines). One corpus shows its commit; several show how many there are.
 */
export function statusText(chat, copy, asking) {
  if (asking) return copy.phase[chat.msgPhase] ?? copy.phase.writing;
  if (chat.status === 'ready' && chat.corpora.length > 0) {
    const chunks = chat.corpora.reduce((n, c) => n + c.chunks, 0);
    const which = chat.corpora.length === 1 ? shortCommit(chat.corpora[0].commit) : fill(copy.pill.corpora, { n: chat.corpora.length });
    const parts = [copy.status.ready, which, fill(copy.pill.chunks, { n: chunks }), fill(copy.pill.dim, { n: chat.corpora[0].dim })];
    if (chat.offline) parts.push(copy.offlineBadge);
    return parts.join(' · ');
  }
  if (chat.status === 'downloading' && chat.progress.totalBytes > 0) return `${copy.status.downloading} ${bytesText(copy, chat.progress)}`;
  if (chat.status === 'indexing' && chat.progress.totalPoints > 0) return `${copy.status.indexing} ${countText(copy, chat.progress)}`;
  return copy.status[chat.status] ?? chat.status;
}

/**
 * What the screen-reader announcer says: the pill's words without its running
 * numbers. The pill ticks every 0.1 MB and every indexed batch, and a live
 * region reading each tick buries everything else; this changes once per
 * stage (and the ready line, which has no running count, reads in full).
 * While the first download waits for consent it names the step only: the
 * focused "download <size>" button already says the size, once.
 */
export function announceText(chat, copy, asking) {
  if (asking || chat.status === 'ready') return statusText(chat, copy, asking);
  return copy.status[chat.status] ?? chat.status;
}

export function statusTone(chat, asking) {
  if (chat.status === 'error') return 'error';
  if (chat.status === 'consent') return 'idle';
  if (chat.status === 'ready') return asking ? 'working' : 'ready';
  return chat.status === 'idle' ? 'idle' : 'working';
}

function stageDetail(chat, copy) {
  const p = chat.progress;
  if (chat.status === 'downloading' || chat.status === 'caching') return p.totalBytes > 0 ? bytesText(copy, p) : '';
  if (chat.status === 'indexing' || chat.status === 'loading-cached') return p.totalPoints > 0 ? countText(copy, p) : '';
  return '';
}

export function loaderStages(chat, copy) {
  const cur = ['loading-cached', 'downloading', 'caching'].includes(chat.status) ? 'corpus' : chat.status;
  const idx = STAGE_ORDER.indexOf(cur);
  return STAGE_ORDER.map((id, i) => ({
    id,
    label: copy.loader.stages[id],
    state: idx === -1 ? 'pending' : i < idx ? 'done' : i === idx ? 'active' : 'pending',
    detail: i === idx ? stageDetail(chat, copy) : '',
  }));
}

/** Determinate progress in percent, or null for the indeterminate sheen. */
export function progressPct(chat) {
  const p = chat.progress;
  if ((chat.status === 'downloading' || chat.status === 'caching') && p.totalBytes > 0) return Math.min(100, (p.loadedBytes / p.totalBytes) * 100);
  if ((chat.status === 'indexing' || chat.status === 'loading-cached') && p.totalPoints > 0) return Math.min(100, (p.indexed / p.totalPoints) * 100);
  return null;
}
