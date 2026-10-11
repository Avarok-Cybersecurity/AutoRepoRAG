// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// ask-errors.js — which error card a fault gets. Pure. The card tells the
// visitor whose problem it is, so the kind must name the real culprit: their
// connection, a busy provider, their key, or the site's published corpus.
// =============================================================================

/**
 * A spent daily allowance is not a momentary rate limit: it has a known reset
 * and its own remedy, so it must never wear the "try again in a few seconds"
 * copy. A request that never reached OpenRouter is the visitor's connection,
 * and only a refusal the adapter marked transient is a rate limit; anything
 * else is a plain hiccup. Returns { kind, resetAt } where kind is one of
 * 'quota' | 'network' | 'key' | 'corpus' | 'rate' | 'generic'.
 */
export function classifyAskError(err) {
  const msg = String(err?.message ?? err);
  if (err?.quota) return { kind: 'quota', resetAt: err.resetAt ?? null };
  if (err?.network === true) return { kind: 'network', resetAt: null };
  if (/\b401\b|\b403\b|invalid.{0,20}key|no auth/i.test(msg)) return { kind: 'key', resetAt: null };
  if (/dimensions but this corpus/.test(msg)) return { kind: 'corpus', resetAt: null };
  if (err?.transient === true) return { kind: 'rate', resetAt: null };
  return { kind: 'generic', resetAt: null };
}

/** Which load-error kind a failed stream maps to. */
export function classifyStreamError(err) {
  return /gzip|decompress|inflate|corrupt/i.test(String(err?.message)) ? 'decompress' : 'corpus';
}

/**
 * A manifest that could not be fetched at all is the connection ('manifest');
 * one the server answered for with an error, or that is not a valid corpus
 * meta, is the site's to fix ('unavailable').
 */
export function manifestFaultKind(err) {
  return err?.network === true ? 'manifest' : 'unavailable';
}

/**
 * A corpus file the server refused (an HTTP status) is the site's to fix
 * ('unavailable'); a transfer that broke off is worth a retry ('corpus').
 */
export function corpusFaultKind(err) {
  return Number.isInteger(err?.status) ? 'unavailable' : 'corpus';
}
