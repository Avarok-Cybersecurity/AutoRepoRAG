// verify.mjs — prove the loaded collection is the corpus (v2 vector path).
//
// Contract: points_count equals what was upserted; a spread sample of points
// retrieves itself (or an identical-text twin) at cosine distance <= 1e-3;
// scrolled vectors equal the local ones within 1e-6. sampleIndexes and
// assertSelfHit are shared with the v3 verifier (src/verify-v3.mjs).

import { log } from './util.mjs';

export const UPSERT_BATCH = 256;
const SELF_RETRIEVAL_SAMPLES = 5;
const SELF_RETRIEVAL_MAX_DISTANCE = 1e-3; // score is a cosine DISTANCE: 0 = identical
const SCROLL_TOLERANCE = 1e-6;
const SCROLL_SAMPLE_LIMIT = 256;

/** Up to SELF_RETRIEVAL_SAMPLES indexes spread evenly over [0, n). */
export function sampleIndexes(n) {
  const sampleIdx = new Set();
  for (let k = 0; k < Math.min(SELF_RETRIEVAL_SAMPLES, n); k++) {
    sampleIdx.add(Math.floor((k * (n - 1)) / Math.max(1, SELF_RETRIEVAL_SAMPLES - 1)));
  }
  return sampleIdx;
}

/**
 * A query built from point `p` must find `p`. Byte-identical chunk text in
 * different files (duplicated headers, copied kernels, a site's repeated
 * footer) is indistinguishable to any retriever, so the point may tie behind
 * a twin: accept the point itself, or a hit whose payload text matches, among
 * the hits `accepted` admits.
 * @param {{id: number, payload: {text: string}}} p
 * @param {Array<{id: number, score: number, payload?: {text?: string}}>} hits
 * @param {(hit: {score: number}) => boolean} accepted
 * @param {string} acceptedText  for the error message
 */
export function assertSelfHit(p, hits, accepted, acceptedText) {
  if (!Array.isArray(hits) || hits.length === 0) {
    throw new Error(`verification failed: self-retrieval for id ${p.id} returned no hits`);
  }
  const near = hits.filter(accepted);
  const self = near.find((h) => h.id === p.id);
  const twin = near.find((h) => h.payload && h.payload.text === p.payload.text);
  if (!self && !twin) {
    const top = hits[0];
    throw new Error(
      `verification failed: self-retrieval for id ${p.id} got id ${top.id} at score ${top.score} ` +
        `(need the point itself or an identical-text twin ${acceptedText})`,
    );
  }
  if (!self && twin) {
    log(`[verify] id ${p.id} tied with identical-text twin id ${twin.id} at score ${twin.score} — accepted`);
  }
}

export async function loadAndVerify(client, collection, dim, points) {
  await client.createCollection(collection, dim);
  for (let i = 0; i < points.length; i += UPSERT_BATCH) {
    await client.upsertBatch(collection, points.slice(i, i + UPSERT_BATCH));
  }
  const info = await client.collectionInfo(collection);
  if (info.points_count !== points.length) {
    throw new Error(`verification failed: server points_count ${info.points_count} != ${points.length} upserted`);
  }

  // Self-retrieval: searching a point's own vector must return that point at
  // (near-)zero cosine distance (assertSelfHit explains the twin rule).
  const n = points.length;
  const sampleIdx = sampleIndexes(n);
  for (const idx of sampleIdx) {
    const p = points[idx];
    const hits = await client.search(collection, p.vector, 5);
    assertSelfHit(p, hits, (h) => h.score <= SELF_RETRIEVAL_MAX_DISTANCE, `at distance <= ${SELF_RETRIEVAL_MAX_DISTANCE}`);
  }

  // Scroll fidelity: vectors the server hands back must equal what we hold
  // locally (both went through fround, so agreement should be exact; 1e-6
  // tolerance allows for transport formatting).
  const byId = new Map(points.map((p) => [p.id, p.vector]));
  const page = await client.scroll(collection, { limit: Math.min(SCROLL_SAMPLE_LIMIT, n) });
  if (!Array.isArray(page?.points) || page.points.length === 0) {
    throw new Error('verification failed: scroll returned no points');
  }
  for (const sp of page.points) {
    const local = byId.get(sp.id);
    if (!local) throw new Error(`verification failed: scroll returned unknown id ${sp.id}`);
    if (!Array.isArray(sp.vector) || sp.vector.length !== local.length) {
      throw new Error(`verification failed: scroll id ${sp.id} vector length ${sp.vector?.length} != ${local.length}`);
    }
    for (let i = 0; i < local.length; i++) {
      if (!(Math.abs(sp.vector[i] - local[i]) <= SCROLL_TOLERANCE)) {
        throw new Error(
          `verification failed: scroll id ${sp.id} component ${i} is ${sp.vector[i]}, local ${local[i]} (tolerance ${SCROLL_TOLERANCE})`,
        );
      }
    }
  }
  log(`[verify] points_count ${info.points_count}, ${sampleIdx.size} self-retrievals, ${page.points.length} scrolled vectors OK`);
}
