// verify-v3.mjs — load a v3 corpus into lattice-server and prove it.
//
// Contract: creates the collection from its shape (src/collection-v3.mjs),
// upserts every point (no vector when lexical), adds every edge in the order
// given, and checks points_count. (The server numbers relations by first
// use; the snapshot renumbers them by name, as the jsonl header does.)
// With vectors: every stored vector is scrolled back and must equal the
// local one within the storage's rounding (f32 1e-6; f16 a 2^-10 relative
// step; int8 the vector's max |component| / 127); the server's values are
// returned, because they are what the snapshot holds and the jsonl must
// agree with it; sampled points retrieve themselves at cosine distance
// <= 1e-3. With a text index: sampled points retrieve themselves (or an
// identical-text twin) in the top 10 of a BM25 query of their own text.

import { createBody } from './collection-v3.mjs';
import { log } from './util.mjs';
import { assertSelfHit, sampleIndexes, UPSERT_BATCH } from './verify.mjs';

const SCROLL_PAGE = 256;
const BM25_TOP = 10;
const SELF_MAX_DISTANCE = 1e-3;

/** Largest acceptable |server - local| for one component under `storage`. */
export function storageTolerance(storage, local) {
  if (storage === 'f32') return () => 1e-6;
  if (storage === 'f16') return (x) => Math.abs(x) / 1024 + 6e-8;
  if (storage === 'int8') {
    const maxAbs = local.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    return () => (maxAbs / 127) * (1 + 1e-6) + 1e-7;
  }
  throw new Error(`unknown vector storage ${JSON.stringify(storage)}`);
}

async function storedVectors(client, collection, points, storage) {
  const stored = await client.scrollAll(collection, { pageSize: SCROLL_PAGE, withPayload: false, withVector: true });
  if (stored.length !== points.length) {
    throw new Error(`verification failed: scroll returned ${stored.length} points, expected ${points.length}`);
  }
  const byId = new Map(stored.map((sp) => [sp.id, sp.vector]));
  return points.map((p) => {
    const sv = byId.get(p.id);
    if (!Array.isArray(sv) || sv.length !== p.vector.length) {
      throw new Error(`verification failed: scroll id ${p.id} vector length ${sv?.length} != ${p.vector.length}`);
    }
    const tol = storageTolerance(storage, p.vector);
    for (let i = 0; i < sv.length; i++) {
      if (!(Math.abs(sv[i] - p.vector[i]) <= tol(p.vector[i]))) {
        throw new Error(
          `verification failed: scroll id ${p.id} component ${i} is ${sv[i]}, local ${p.vector[i]} ` +
            `(beyond ${storage} rounding ${tol(p.vector[i])})`,
        );
      }
    }
    return { ...p, vector: sv };
  });
}

/**
 * @param {import('./adapters/lattice-http.mjs').LatticeClient} client
 * @param {{collection: string, shape: import('./collection-v3.mjs').CollectionShape,
 *   points: Array<{id: number, vector: number[], payload: {text: string}}>,
 *   edges: Array<{from: number, to: number, rel: string, w: number}>, clock: {nowMs: () => number}}} opts
 * @returns {Promise<Array<{id: number, vector: number[], payload: {text: string}}>>} points as stored
 */
export async function loadAndVerifyV3(client, { collection, shape, points, edges, clock }) {
  const started = clock.nowMs();
  const vectors = shape.searchMode !== 'lexical';
  await client.createCollectionFrom(collection, createBody(shape));
  for (let i = 0; i < points.length; i += UPSERT_BATCH) {
    const batch = points.slice(i, i + UPSERT_BATCH)
      .map((p) => (vectors ? { id: p.id, vector: p.vector, payload: p.payload } : { id: p.id, payload: p.payload }));
    await client.upsertBatch(collection, batch);
  }
  for (const e of edges) await client.addEdge(collection, e);
  const info = await client.collectionInfo(collection);
  if (info.points_count !== points.length) {
    throw new Error(`verification failed: server points_count ${info.points_count} != ${points.length} upserted`);
  }

  const stored = vectors ? await storedVectors(client, collection, points, shape.vectorStorage) : points;
  const samples = sampleIndexes(stored.length);
  for (const idx of samples) {
    const p = stored[idx];
    if (vectors) {
      const hits = await client.search(collection, p.vector, 5);
      assertSelfHit(p, hits, (h) => h.score <= SELF_MAX_DISTANCE, `at distance <= ${SELF_MAX_DISTANCE}`);
    }
    if (shape.searchMode !== 'vector') {
      const res = await client.query(collection, {
        query: { text: p.payload.text, model: 'bm25' }, limit: BM25_TOP, with_payload: true,
      });
      assertSelfHit(p, res?.points, () => true, `in the BM25 top ${BM25_TOP}`);
    }
  }
  log(
    `[verify] points_count ${info.points_count}, ${edges.length} edges, ${samples.size} sampled self-retrievals` +
      `${vectors ? `, ${stored.length} stored vectors within ${shape.vectorStorage} rounding` : ''} (${clock.nowMs() - started} ms)`,
  );
  return stored;
}
