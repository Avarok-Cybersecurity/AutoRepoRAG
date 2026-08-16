// jsonl.mjs — lattice-jsonl v1 writer and parser.
//
// Contract (mirrors lattice-db/crates/lattice-core/src/interchange/jsonl.rs):
// one JSON object per line, every object's keys sorted lexicographically at
// every nesting level (including the "t" tag); line 1 is the header; point
// lines ascend by id; `labels` omitted when 0, `payload` omitted when empty,
// `vector` omitted when absent (this writer always inlines vectors and always
// has a payload). The header `config` is the serde form of latticedb-core
// CollectionConfig. Output must round-trip through Rust import_jsonl.

import { formatRustF64, stableStringify } from './util.mjs';

export const FORMAT = 'lattice-jsonl';
export const FORMAT_VERSION = 1;

/**
 * serde form of latticedb-core CollectionConfig (types/collection.rs).
 * HnswConfig has no Default impl (PCND); these are the crate's canonical
 * values used throughout lattice-core (engine/collection, cypher, tests):
 * m 16, m0 2*m, ml = 1/ln(16) = 0.36067376022224085 (recommended_ml(16)),
 * ef 100, ef_construction 200. Distance serializes lowercase ("cosine");
 * only the REST create API uses capitalized "Cosine".
 */
export function collectionConfig(name, dim) {
  return {
    durability: 'ephemeral',
    hnsw: { ef: 100, ef_construction: 200, m: 16, m0: 32, ml: 1 / Math.log(16) },
    name,
    relations: {},
    vectors: { distance: 'cosine', size: dim },
  };
}

function assertPoint(p, dim) {
  if (!Number.isSafeInteger(p.id) || p.id < 1) {
    throw new Error(`corpus point has invalid id ${JSON.stringify(p.id)} (need integer >= 1)`);
  }
  if (!Array.isArray(p.vector) || p.vector.length !== dim) {
    throw new Error(`corpus point ${p.id} vector length ${p.vector?.length} != dim ${dim}`);
  }
  if (p.payload === null || typeof p.payload !== 'object' || Object.keys(p.payload).length === 0) {
    throw new Error(`corpus point ${p.id} must carry a non-empty payload`);
  }
}

/**
 * Serialize a corpus to lattice-jsonl v1 text (trailing newline included).
 * points: [{id, vector, payload}] — sorted ascending by id here; vectors must
 * already be quantized (the same values were upserted to the server).
 */
export function serializeCorpus({ collectionName, dim, points }) {
  const sorted = [...points].sort((a, b) => a.id - b.id);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].id === sorted[i - 1].id) {
      throw new Error(`corpus has duplicate point id ${sorted[i].id}`);
    }
  }
  const lines = [];
  lines.push(
    stableStringify({
      config: collectionConfig(collectionName, dim),
      dim,
      edges: 0,
      format: FORMAT,
      points: sorted.length,
      t: 'header',
      version: FORMAT_VERSION,
      vectors: 'inline',
    }),
  );
  for (const p of sorted) {
    assertPoint(p, dim);
    // labels always 0 for corpus points -> omitted (skip_serializing_if is_zero).
    // Keys "id" < "payload" < "t" < "vector" are already in UTF-8 byte order.
    // Vector components use the ryu-parity formatter (serde_json f64 bytes);
    // payload numbers stay bare JSON.stringify (Rust parses those as integers).
    const vector = p.vector.map((x) => formatRustF64(x)).join(',');
    lines.push(`{"id":${p.id},"payload":${stableStringify(p.payload)},"t":"point","vector":[${vector}]}`);
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Parse lattice-jsonl text (used for previous-corpus reuse). Enforces the same
 * invariants as Rust import_jsonl: recognized format, version <= 1, exactly
 * one header and it comes first, header counts equal body counts. Returns
 * { header, points: [{id, vector, payload, labels}] }.
 */
export function parseCorpus(text) {
  let header = null;
  const points = [];
  let edgeCount = 0;
  const lines = text.split('\n');
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (line.trim() === '') continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (e) {
      throw new Error(`corpus line ${n + 1} is not valid JSON: ${e.message}`);
    }
    const tag = obj.t;
    if (tag === 'header') {
      if (header !== null) throw new Error(`corpus has a second header at line ${n + 1}`);
      if (obj.format !== FORMAT) {
        throw new Error(`not a ${FORMAT} dump: format is ${JSON.stringify(obj.format)}`);
      }
      if (!Number.isInteger(obj.version) || obj.version > FORMAT_VERSION) {
        throw new Error(
          `corpus is format version ${obj.version} but this reader understands at most ${FORMAT_VERSION}`,
        );
      }
      if (!Number.isInteger(obj.dim) || obj.dim < 1) {
        throw new Error(`corpus header has invalid dim ${JSON.stringify(obj.dim)}`);
      }
      header = obj;
    } else if (tag === 'point') {
      if (header === null) throw new Error(`point at line ${n + 1} precedes the header`);
      if (!Number.isSafeInteger(obj.id) || obj.id < 0) {
        throw new Error(`point at line ${n + 1} has invalid id ${JSON.stringify(obj.id)} (need integer >= 0)`);
      }
      if (obj.vector !== undefined) {
        if (!Array.isArray(obj.vector)) {
          throw new Error(`point at line ${n + 1} has a non-array vector`);
        }
        for (const x of obj.vector) {
          if (typeof x !== 'number' || !Number.isFinite(x)) {
            throw new Error(`point at line ${n + 1} has a non-finite vector component ${JSON.stringify(x)}`);
          }
        }
      }
      if (obj.labels !== undefined && (!Number.isSafeInteger(obj.labels) || obj.labels < 0)) {
        throw new Error(`point at line ${n + 1} has invalid labels ${JSON.stringify(obj.labels)} (need integer >= 0)`);
      }
      points.push({
        id: obj.id,
        vector: obj.vector ?? [],
        payload: obj.payload ?? {},
        labels: obj.labels ?? 0,
      });
    } else if (tag === 'edge') {
      if (header === null) throw new Error(`edge at line ${n + 1} precedes the header`);
      edgeCount += 1;
    } else {
      throw new Error(`corpus line ${n + 1} has unknown tag ${JSON.stringify(tag)}`);
    }
  }
  if (header === null) throw new Error('corpus has no header line');
  if (points.length !== header.points || edgeCount !== header.edges) {
    throw new Error(
      `corpus is truncated or corrupt: header declares ${header.points} point(s) and ` +
        `${header.edges} edge(s), body has ${points.length} and ${edgeCount}`,
    );
  }
  return { header, points };
}
