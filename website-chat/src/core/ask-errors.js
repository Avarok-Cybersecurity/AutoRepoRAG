// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// ask-errors.js — which error card a failed question gets. Pure.
// =============================================================================

/**
 * A spent daily allowance is not a momentary rate limit: it has a known reset
 * and its own remedy, so it must never wear the "try again in a few seconds"
 * copy. Returns { kind, resetAt } where kind is one of
 * 'quota' | 'key' | 'corpus' | 'rate'.
 */
export function classifyAskError(err) {
  const msg = String(err?.message ?? err);
  if (err?.quota) return { kind: 'quota', resetAt: err.resetAt ?? null };
  if (/\b401\b|\b403\b|invalid.{0,20}key|no auth/i.test(msg)) return { kind: 'key', resetAt: null };
  if (/dimensions but this corpus/.test(msg)) return { kind: 'corpus', resetAt: null };
  return { kind: 'rate', resetAt: null };
}

/** Which load-error kind a failed stream maps to. */
export function classifyStreamError(err) {
  return /gzip|decompress|inflate|corrupt/i.test(String(err?.message)) ? 'decompress' : 'corpus';
}
