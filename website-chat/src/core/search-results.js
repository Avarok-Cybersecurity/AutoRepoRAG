// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// search-results.js — what one search result shows, from a hit's payload.
// Pure. Payloads are untrusted data (a site's sidecar fields and repository
// text), so every field is type-checked here and the UI renders the result as
// text nodes only: a link exists only for an http(s) url, and a url without a
// fragment gets none invented.
// =============================================================================

import { fuseRanked, queryBody } from './search.js';

/**
 * @typedef {{text: string, hit: boolean}} Segment
 * @typedef {object} SearchResult
 * @property {string} key          unique across corpora: "<corpus id>:<point id>"
 * @property {string} corpusId
 * @property {string|null} url     an absolute http(s) url, or null (no link)
 * @property {string} title
 * @property {string[]} crumbs     the chunk's heading path, outermost first
 * @property {Segment[]} snippet   plain text, query terms marked
 */

const MAX_TITLE = 200;
const ELLIPSIS = '…';

/** An absolute http(s) url, normalized, or null. */
export function safeHttpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

const words = (value) => (typeof value === 'string' ? value.trim() : '');

/** Markdown chunk text as one line of prose: no heading lines (the breadcrumb has them), no markup. */
function proseOf(text) {
  const lines = text.split('\n');
  const body = lines.filter((l) => !/^\s{0,3}#{1,6}\s/.test(l));
  return (body.some((l) => l.trim() !== '') ? body : lines)
    .map((l) => l.replace(/^\s{0,3}#{1,6}\s+/, '').replace(/^\s*(?:[-*+]|\d+[.)]|>)\s+/, ''))
    .join(' ')
    .replace(/```\w*/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The query's words, lower-cased, longest first so a longer term wins a shared prefix. */
function termsOf(query) {
  const found = String(query).toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  return [...new Set(found)].sort((a, b) => b.length - a.length);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * About `maxChars` of the chunk's prose around the first query term (from the
 * start when none matches), cut at word boundaries, with every term marked.
 * @param {string} text
 * @param {string} query
 * @param {number} maxChars
 * @returns {Segment[]}
 */
export function snippet(text, query, maxChars) {
  const prose = proseOf(text);
  if (prose === '') return [];
  const terms = termsOf(query);
  const lower = prose.toLowerCase();
  const first = Math.min(...terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0), Infinity);

  let start = first === Infinity ? 0 : Math.max(0, first - Math.floor(maxChars / 3));
  if (start > 0) start = prose.indexOf(' ', start) + 1 || start;
  let end = Math.min(prose.length, start + maxChars);
  if (end < prose.length) {
    const cut = prose.lastIndexOf(' ', end);
    if (cut > start) end = cut;
  }
  const window = (start > 0 ? ELLIPSIS : '') + prose.slice(start, end).trim() + (end < prose.length ? ELLIPSIS : '');

  if (terms.length === 0) return [{ text: window, hit: false }];
  const re = new RegExp(`(${terms.map(escapeRe).join('|')})`, 'giu');
  return window
    .split(re)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, hit: terms.includes(part.toLowerCase()) }));
}

/**
 * @param {{corpus: {id: string}, hit: import('./search.js').Hit}} entry
 * @param {string} query
 * @param {number} snippetChars  config.search.snippetChars
 * @returns {SearchResult}
 */
export function toResult({ corpus, hit }, query, snippetChars) {
  const p = hit.payload;
  const crumbs = Array.isArray(p.heading_path) ? p.heading_path.map(words).filter((w) => w !== '') : [];
  const title = words(p.title) || crumbs.at(-1) || words(p.path) || `#${hit.id}`;
  return {
    key: `${corpus.id}:${hit.id}`,
    corpusId: corpus.id,
    url: safeHttpUrl(p.url),
    title: title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE)}${ELLIPSIS}` : title,
    crumbs,
    snippet: typeof p.text === 'string' ? snippet(p.text, query, snippetChars) : [],
  };
}

/**
 * Search every ready corpus for `text` (each with its own plan, `topK`
 * deep), fuse the lists by rank and shape the results. Orchestration over the
 * injected `query` port (adapters/lattice-search.js).
 * @param {string} text
 * @param {object} opts
 * @param {(collection: string, body: object) => Promise<import('./search.js').Hit[]>} opts.query
 * @param {Array<{id: string, collection: string, plan: import('./search.js').QueryPlan}>} opts.corpora
 * @param {number} opts.topK
 * @param {number} opts.snippetChars
 * @returns {Promise<SearchResult[]>}
 */
export async function searchCorpora(text, { query, corpora, topK, snippetChars }) {
  const perCorpus = await Promise.all(corpora.map(async (corpus) => ({ corpus, hits: await query(corpus.collection, queryBody(text, corpus.plan, topK)) })));
  return fuseRanked(perCorpus, topK).map((entry) => toResult(entry, text, snippetChars));
}
