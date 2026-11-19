// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// search.js — search mode's retrieval rules. Pure: no DOM, no wasm.
//
//   planFor()           how one corpus is queried: BM25, dense, or both fused
//   queryBody()         the Qdrant-style /points/query body for that plan
//   parseQueryResponse  the router's answer -> points, or a thrown reason
//   fuseRanked()        one ranked list across corpora
//   checkedEmbed()      the site's embedder, with its output shape enforced
//
// Scores are never compared across corpora: BM25 is a similarity on each
// corpus's own term statistics (higher = better), and a fused hybrid score is
// a rank sum. fuseRanked() therefore merges by RANK with Reciprocal Rank
// Fusion, the same rule the engine uses inside a hybrid query.
// =============================================================================

/** RRF's k, as in the engine (lattice: `{"fusion": "rrf"}`, k = 60). */
const RRF_K = 60;
/** Each half of a hybrid query recalls this many times `limit` before fusion. */
const PREFETCH_FACTOR = 4;
/** The only snapshot format this chat installs (lattice-db >= v0.5.0 writes it). */
export const SNAPSHOT_FORMAT = 2;

/**
 * @typedef {{kind: 'bm25', model: null} | {kind: 'dense'|'hybrid', model: string}} QueryPlan
 * @typedef {{model: string, dim: number, embed: (texts: string[]) => Promise<ReadonlyArray<number[]|Float32Array>>}} SiteEmbedder
 * @typedef {{id: number|string, score: number, payload: Record<string, unknown>}} Hit
 */

/**
 * How corpus `id` is searched. Throws a sentence for the site author when
 * the corpus cannot be searched as configured.
 * @param {import('./search-meta.js').SearchMeta} meta
 * @param {SiteEmbedder|null} embedder  config.search.embedder
 * @param {string} id
 * @returns {QueryPlan}
 */
export function planFor(meta, embedder, id) {
  if (meta.snapshot === null) {
    throw new Error(`corpus "${id}" was published without a snapshot (the action ran with snapshot: false); search mode installs <name>.lattice, so rebuild it with snapshot: true.`);
  }
  if (meta.snapshot.format !== SNAPSHOT_FORMAT) {
    throw new Error(`corpus "${id}" has a snapshot in format ${meta.snapshot.format}; this chat installs format ${SNAPSHOT_FORMAT} (lattice-db >= v0.5.0).`);
  }
  if (meta.searchMode === 'lexical') return { kind: 'bm25', model: null };
  if (embedder === null) {
    if (meta.searchMode === 'hybrid') return { kind: 'bm25', model: null };
    throw new Error(`corpus "${id}" has no text index (search_mode vector), so it is searched by embedding the query: set search.embedder to its model, ${meta.model} (dim ${meta.dim}).`);
  }
  if (embedder.model !== meta.model || embedder.dim !== meta.dim) {
    throw new Error(
      `corpus "${id}" was built with ${meta.model} (dim ${meta.dim}) but search.embedder is ${embedder.model} (dim ${embedder.dim}); ` +
        'its query vectors would not match the corpus.'
    );
  }
  return { kind: meta.searchMode === 'hybrid' ? 'hybrid' : 'dense', model: /** @type {string} */ (meta.model) };
}

/**
 * @param {string} text
 * @param {QueryPlan} plan
 * @param {number} limit
 */
export function queryBody(text, plan, limit) {
  if (plan.kind === 'bm25') return { query: { text, model: 'bm25' }, limit, with_payload: true };
  if (plan.kind === 'dense') return { query: { text, model: plan.model }, limit, with_payload: true };
  const recall = limit * PREFETCH_FACTOR;
  return {
    prefetch: [
      { query: { text, model: 'bm25' }, limit: recall },
      { query: { text, model: plan.model }, limit: recall },
    ],
    query: { fusion: 'rrf' },
    limit,
    with_payload: true,
  };
}

const isRecord = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * The points of a /points/query answer. A non-200 throws with the router's
 * message; points without an object payload are dropped (nothing to show).
 * @param {number} status
 * @param {string} bodyText
 * @returns {Hit[]}
 */
export function parseQueryResponse(status, bodyText) {
  let body = null;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }
  if (status !== 200) {
    const why = isRecord(body) && typeof body.message === 'string' ? `: ${body.message}` : '';
    throw new Error(`search failed: HTTP ${status}${why}`);
  }
  const points = isRecord(body) && body.status === 'ok' && isRecord(body.result) ? body.result.points : undefined;
  if (!Array.isArray(points)) throw new Error('search failed: the engine answered with no points');
  return points
    .filter((p) => isRecord(p) && isRecord(p.payload) && (typeof p.id === 'number' || typeof p.id === 'string') && typeof p.score === 'number')
    .map((p) => ({ id: p.id, score: p.score, payload: p.payload }));
}

/**
 * One list from each corpus's ranked hits: RRF over ranks (1 / (k + rank)),
 * ties to the corpus listed first in config, cut to `topK`.
 * @template C
 * @param {Array<{corpus: C, hits: Hit[]}>} perCorpus
 * @param {number} topK
 * @returns {Array<{corpus: C, hit: Hit, rank: number}>}
 */
export function fuseRanked(perCorpus, topK) {
  return perCorpus
    .flatMap(({ corpus, hits }, order) => hits.map((hit, i) => ({ corpus, hit, rank: i + 1, order, rrf: 1 / (RRF_K + i + 1) })))
    .sort((a, b) => b.rrf - a.rrf || a.order - b.order)
    .slice(0, topK)
    .map(({ corpus, hit, rank }) => ({ corpus, hit, rank }));
}

/**
 * The site's embedder as the engine calls it, refusing output that would
 * search with wrong vectors (a count or a dimension that does not match).
 * @param {SiteEmbedder} embedder
 * @returns {(texts: string[]) => Promise<ReadonlyArray<number[]|Float32Array>>}
 */
export function checkedEmbed(embedder) {
  return async (texts) => {
    const vectors = await embedder.embed(texts);
    if (!Array.isArray(vectors) || vectors.length !== texts.length) {
      throw new Error(`search.embedder returned ${Array.isArray(vectors) ? vectors.length : 0} vectors for ${texts.length} text(s)`);
    }
    for (const v of vectors) {
      const n = v instanceof Float32Array || Array.isArray(v) ? v.length : 0;
      if (n !== embedder.dim) throw new Error(`search.embedder returned ${n} dimensions; ${embedder.model} is configured with ${embedder.dim}`);
    }
    return vectors;
  };
}
