// snapshot.mjs — the LatticeDB snapshot the action publishes (v3).
//
// Contract: parseSnapshotHeader, assertSnapshotMatches and assertSnapshotSize
// are pure. Format 2 is "LTDB" | u32 LE format | u32 LE config_len | config
// JSON | u64 body_len | pad | rkyv body (lattice-db docs/edge-search.md).
// exportVerifiedSnapshot exports the loaded collection and proves the
// snapshot describes the same collection as the jsonl header (format,
// config) and fits max-snapshot-bytes. Then it round-trips it natively: the
// probe query runs on the loaded collection, the collection is dropped, the
// snapshot is imported under the same name (import?mode=create; the config
// it carries names the collection), and points_count, the probe's ids and
// scores, and a second export's bytes must all equal the first.

import { log } from './log.mjs';
import { stableStringify } from './util.mjs';

export const SNAPSHOT_FORMAT = 2;
const MIB = 1024 * 1024;

/** @returns {{format: number, config: unknown}} */
export function parseSnapshotHeader(bytes) {
  if (bytes.length < 12 || bytes.toString('latin1', 0, 4) !== 'LTDB') {
    throw new Error('not a LatticeDB snapshot (no "LTDB" magic)');
  }
  const format = bytes.readUInt32LE(4);
  const configLen = bytes.readUInt32LE(8);
  if (12 + configLen > bytes.length) {
    throw new Error(`snapshot config length ${configLen} runs past the end (${bytes.length} bytes)`);
  }
  return { format, config: JSON.parse(bytes.toString('utf8', 12, 12 + configLen)) };
}

/** The snapshot must be format 2 and carry exactly the jsonl header's config. */
export function assertSnapshotMatches(bytes, expectedConfig) {
  const { format, config } = parseSnapshotHeader(bytes);
  if (format !== SNAPSHOT_FORMAT) throw new Error(`snapshot format ${format}, expected ${SNAPSHOT_FORMAT}`);
  const got = stableStringify(config);
  const want = stableStringify(expectedConfig);
  if (got !== want) {
    throw new Error(`snapshot config differs from the jsonl header config:\n  snapshot: ${got}\n  jsonl:    ${want}`);
  }
}

export function assertSnapshotSize(size, max) {
  if (size > max) {
    const mib = (n) => `${(n / MIB).toFixed(2)} MiB`;
    throw new Error(
      `snapshot is ${size} bytes (${mib(size)}), over max-snapshot-bytes ${max} (${mib(max)}); ` +
        'narrow paths/exclude, use vector-storage f16/int8, or search-mode lexical',
    );
  }
}

const PROBE_LIMIT = 10;

/**
 * The query the round-trip repeats: BM25 on the first point's text when the
 * collection has a text index, else a vector search on its stored vector.
 * Resolves to the hits as [id, score] pairs.
 * @param {'lexical'|'vector'|'hybrid'} searchMode
 * @param {{vector: number[], payload: {text: string}}} point
 * @returns {(client: import('./adapters/lattice-http.mjs').LatticeClient, name: string) => Promise<Array<[number, number]>>}
 */
export function snapshotProbe(searchMode, point) {
  const pairs = (hits) => (hits ?? []).map((h) => [h.id, h.score]);
  if (searchMode === 'vector') return async (client, name) => pairs(await client.search(name, point.vector, PROBE_LIMIT));
  return async (client, name) => pairs((await client.query(name, {
    query: { text: point.payload.text, model: 'bm25' }, limit: PROBE_LIMIT, with_payload: false,
  }))?.points);
}

/** Throws unless the imported collection answered exactly as the original did. */
export function assertRoundTrip({ pointsBefore, pointsAfter, hitsBefore, hitsAfter, bytes, reexported }) {
  if (pointsAfter !== pointsBefore) {
    throw new Error(`snapshot round-trip: imported points_count ${pointsAfter} != ${pointsBefore}`);
  }
  if (hitsBefore.length === 0) throw new Error('snapshot round-trip: the probe query returned no hits to compare');
  if (JSON.stringify(hitsAfter) !== JSON.stringify(hitsBefore)) {
    throw new Error(
      `snapshot round-trip: probe hits differ after import:\n  before: ${JSON.stringify(hitsBefore)}\n  after:  ${JSON.stringify(hitsAfter)}`,
    );
  }
  if (!reexported.equals(bytes)) {
    throw new Error(`snapshot round-trip: re-export is not byte-identical (${reexported.length} vs ${bytes.length} bytes)`);
  }
}

/**
 * @param {import('./adapters/lattice-http.mjs').LatticeClient} client
 * @param {{collection: string, config: unknown, maxBytes: number,
 *   probe: (client: import('./adapters/lattice-http.mjs').LatticeClient, name: string) => Promise<Array<[number, number]>>,
 *   clock: {nowMs: () => number}}} opts
 * @returns {Promise<Buffer>}
 */
export async function exportVerifiedSnapshot(client, { collection, config, maxBytes, probe, clock }) {
  const started = clock.nowMs();
  const bytes = await client.exportSnapshot(collection);
  assertSnapshotMatches(bytes, config);
  assertSnapshotSize(bytes.length, maxBytes);

  const pointsBefore = (await client.collectionInfo(collection)).points_count;
  const hitsBefore = await probe(client, collection);
  await client.deleteCollection(collection);
  await client.importSnapshot(collection, bytes, 'create');
  const pointsAfter = (await client.collectionInfo(collection)).points_count;
  const hitsAfter = await probe(client, collection);
  const reexported = await client.exportSnapshot(collection);
  assertRoundTrip({ pointsBefore, pointsAfter, hitsBefore, hitsAfter, bytes, reexported });
  log(
    `[snapshot] format ${SNAPSHOT_FORMAT}, ${bytes.length} bytes, config matches the jsonl header; ` +
      `native import: ${pointsAfter} points, ${hitsAfter.length} probe hits identical, re-export byte-identical ` +
      `(${clock.nowMs() - started} ms)`,
  );
  return bytes;
}
