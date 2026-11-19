// collection-v3.mjs — the v3 collection shape, in both of its spellings.
//
// Contract: pure. One description of the collection yields (a) the REST
// create body sent to lattice-server and (b) the serde CollectionConfig the
// jsonl header records. They must describe the same collection: the action
// checks (b) against the config the server writes into the snapshot, so a
// drift between the two fails the run instead of shipping a header that
// lies. HNSW values are stated, not defaulted (PCND): m 16, m0 32,
// ml 1/ln(16), ef_construct 200 (the server sets ef = ef_construct). BM25
// k1 1.2 / b 0.75 are lattice-db's documented BM25 constants, stated here.

export const TEXT_FIELD = 'text';
const HNSW = Object.freeze({ m: 16, m0: 32, ml: 1 / Math.log(16), efConstruct: 200 });
const BM25 = Object.freeze({ k1: 1.2, b: 0.75 });

/**
 * @typedef {{name: string, searchMode: 'lexical'|'vector'|'hybrid', dim: number,
 *   vectorIndex: 'hnsw'|'flat'|null, vectorStorage: 'f32'|'f16'|'int8'|null,
 *   model: string|null, relations: Record<string, number>}} CollectionShape
 */

const hasVectors = (shape) => shape.searchMode !== 'lexical';
const hasText = (shape) => shape.searchMode !== 'vector';

/** @param {CollectionShape} shape */
export function createBody(shape) {
  return {
    durability: 'ephemeral',
    hnsw_config: { m: HNSW.m, m0: HNSW.m0, ml: HNSW.ml, ef_construct: HNSW.efConstruct },
    ...(hasVectors(shape) ? {
      vectors: { size: shape.dim, distance: 'Cosine', index: shape.vectorIndex, storage: shape.vectorStorage },
      embedding: { model: shape.model },
    } : {}),
    ...(hasText(shape) ? { text_index: { field: TEXT_FIELD, k1: BM25.k1, b: BM25.b } } : {}),
  };
}

/** serde form of latticedb-core CollectionConfig for the jsonl header. @param {CollectionShape} shape */
export function headerConfig(shape) {
  return {
    durability: 'ephemeral',
    hnsw: { ef: HNSW.efConstruct, ef_construction: HNSW.efConstruct, m: HNSW.m, m0: HNSW.m0, ml: HNSW.ml },
    name: shape.name,
    relations: shape.relations,
    ...(hasVectors(shape) ? {
      vectors: { distance: 'cosine', index: shape.vectorIndex, size: shape.dim, storage: shape.vectorStorage },
      embedding: { model: shape.model },
    } : {}),
    ...(hasText(shape) ? { text_index: { b: BM25.b, field: TEXT_FIELD, k1: BM25.k1 } } : {}),
  };
}

/** The text field BM25 indexes, or null when the collection has no text index. */
export const textField = (shape) => (hasText(shape) ? TEXT_FIELD : null);
