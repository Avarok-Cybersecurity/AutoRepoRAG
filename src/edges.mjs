// edges.mjs — resolve graph edges between corpus points.
//
// Contract: pure. Edges come from two places: the automatic "next" edge
// between consecutive chunks of one file (chunk-strategy markdown), and the
// edges-file, a JSON array of
//   {"from": {"path": "a.md", "chunk": 0}, "to": {"path": "b.md"},
//    "relation": "links_to", "weight": 1}
// where `chunk` is the 0-based index of a chunk within its file (default 0,
// the file's first chunk). Paths and indexes resolve to point ids; anything
// unresolvable, a self-loop, or a duplicate (from, to, relation) fails
// naming the entry. The result is sorted (from, relation, to), the order
// lattice-db's own jsonl export writes, and relation ids are 0..n in
// ascending relation-name order: lattice-db >= v0.5.1 renumbers them that
// way in every snapshot, so the jsonl header and the snapshot agree.

const RELATION = /^[A-Za-z0-9_.:-]{1,64}$/;
export const NEXT_RELATION = 'next';

/** @typedef {{from: number, to: number, rel: string, w: number}} Edge */

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function endpoint(byPath, value, where) {
  if (!isPlainObject(value) || typeof value.path !== 'string') throw new Error(`${where} must be {path, chunk?}`);
  const ids = byPath.get(value.path);
  if (!ids) throw new Error(`${where}.path ${JSON.stringify(value.path)} is not in the corpus`);
  const chunk = value.chunk ?? 0;
  if (!Number.isSafeInteger(chunk) || chunk < 0) throw new Error(`${where}.chunk must be an integer >= 0`);
  if (chunk >= ids.length) {
    throw new Error(`${where}.chunk ${chunk} is out of range: ${JSON.stringify(value.path)} has ${ids.length} chunk(s)`);
  }
  return ids[chunk];
}

/**
 * @param {Array<{id: number, path: string, ordinal: number}>} chunks  in id order
 * @param {unknown} spec  parsed edges-file JSON ([] when there is none)
 * @param {{nextEdges: boolean}} opts
 * @returns {{edges: Edge[], relations: Record<string, number>}}
 */
export function resolveEdges(chunks, spec, { nextEdges }) {
  if (!Array.isArray(spec)) throw new Error('edges-file must be a JSON array of {from, to, relation, weight}');
  const byPath = new Map();
  for (const c of chunks) {
    if (!byPath.has(c.path)) byPath.set(c.path, []);
    byPath.get(c.path)[c.ordinal] = c.id;
  }
  const edges = [];
  const origin = new Map();
  const add = (edge, source) => {
    const key = `${edge.from}\0${edge.to}\0${edge.rel}`;
    if (origin.has(key)) throw new Error(`${source} duplicates ${origin.get(key)}`);
    origin.set(key, source);
    edges.push(edge);
  };
  if (nextEdges) {
    for (const ids of byPath.values()) {
      for (let i = 1; i < ids.length; i++) {
        add({ from: ids[i - 1], to: ids[i], rel: NEXT_RELATION, w: 1 }, `the automatic "${NEXT_RELATION}" edge`);
      }
    }
  }
  spec.forEach((e, i) => {
    const where = `edges-file[${i}]`;
    if (!isPlainObject(e)) throw new Error(`${where} must be an object {from, to, relation, weight}`);
    const from = endpoint(byPath, e.from, `${where}.from`);
    const to = endpoint(byPath, e.to, `${where}.to`);
    if (typeof e.relation !== 'string' || !RELATION.test(e.relation)) {
      throw new Error(`${where}.relation must match ${RELATION}`);
    }
    if (typeof e.weight !== 'number' || !Number.isFinite(e.weight)) throw new Error(`${where}.weight must be a finite number`);
    if (from === to) throw new Error(`${where} is a self-loop on point ${from}`);
    add({ from, to, rel: e.relation, w: e.weight }, where);
  });
  edges.sort((a, b) => a.from - b.from || (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0) || a.to - b.to);
  const names = [...new Set(edges.map((e) => e.rel))].sort();
  const relations = Object.fromEntries(names.map((name, id) => [name, id]));
  return { edges, relations };
}
