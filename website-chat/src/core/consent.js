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
 * @returns {null | { corpora: Array<{id: string, bytes: number}>, wasmBytes: number|null, totalBytes: number, storedBytes: number }}
 *   null when nothing large would be downloaded (no question to ask).
 *   totalBytes is the transfer; storedBytes what the browser then keeps (the
 *   decompressed corpora, meta `bytes`).
 */
export function missingDownload(plan, wasmBytes) {
  const missing = plan.filter((p) => !p.file);
  if (missing.length === 0) return null;
  const corpora = missing.map((p) => ({ id: p.corpus.id, bytes: p.meta.gzBytes }));
  const totalBytes = corpora.reduce((n, c) => n + c.bytes, 0) + (wasmBytes ?? 0);
  const storedBytes = missing.reduce((n, p) => n + p.meta.bytes, 0);
  return { corpora, wasmBytes, totalBytes, storedBytes };
}

/**
 * A byte count for a person, in decimal SI units (1 KB = 10^3 bytes, 1 MB =
 * 10^6), as downloads and sites report sizes: KB below one megabyte, MB from
 * there, one decimal.
 */
export function formatSize(bytes, copy) {
  if (bytes < 999_950) return fill(copy.size.kb, { n: (bytes / 1000).toFixed(1) });
  return fill(copy.size.mb, { n: (bytes / 1_000_000).toFixed(1) });
}
