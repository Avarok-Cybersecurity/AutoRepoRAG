// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// consent.js — what the first open asks the visitor before downloading. Pure.
// Only corpora with no cached copy at their current commit are asked for,
// plus the search engine (the wasm) when it still has to be fetched.
// =============================================================================

import { fill } from './template.js';

/**
 * @param {Array<{corpus: {id: string}, meta: {gzBytes: number}, file: object|null}>} plan
 *   the loader's per-corpus plan; `file` is the cached copy, null when missing
 * @param {number|null} wasmBytes  0 when the engine is cached or loaded, null when its size is unknown
 * @returns {null | { corpora: Array<{id: string, bytes: number}>, wasmBytes: number|null, totalBytes: number }}
 *   null when nothing large would be downloaded (no question to ask)
 */
export function missingDownload(plan, wasmBytes) {
  const corpora = plan.filter((p) => !p.file).map((p) => ({ id: p.corpus.id, bytes: p.meta.gzBytes }));
  if (corpora.length === 0) return null;
  const totalBytes = corpora.reduce((n, c) => n + c.bytes, 0) + (wasmBytes ?? 0);
  return { corpora, wasmBytes, totalBytes };
}

/** A byte count for a person: KB below one megabyte, MB from there, one decimal. */
export function formatSize(bytes, copy) {
  if (bytes < 1048576) return fill(copy.size.kb, { n: (bytes / 1024).toFixed(1) });
  return fill(copy.size.mb, { n: (bytes / 1048576).toFixed(1) });
}
