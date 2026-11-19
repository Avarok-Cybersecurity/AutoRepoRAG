// snapshot.mjs — the LatticeDB snapshot the action publishes (v3).
//
// Contract: parseSnapshotHeader, assertSnapshotMatches and assertSnapshotSize
// are pure. Format 2 is "LTDB" | u32 LE format | u32 LE config_len | config
// JSON | u64 body_len | pad | rkyv body (lattice-db docs/edge-search.md).
// exportVerifiedSnapshot exports the loaded collection and proves the
// snapshot describes the same collection as the jsonl header (format,
// config) and fits max-snapshot-bytes. It does not load the snapshot back:
// lattice-server's native transport drops the query string, so
// POST /collections/{n}/import?mode=... is unusable there (wasm route() is
// fine); test/integration/site.test.mjs loads it in the wasm build instead.

import { log, stableStringify } from './util.mjs';

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

/**
 * @param {import('./lattice.mjs').LatticeClient} client
 * @param {{collection: string, config: unknown, maxBytes: number}} opts
 * @returns {Promise<Buffer>}
 */
export async function exportVerifiedSnapshot(client, { collection, config, maxBytes }) {
  const started = Date.now();
  const bytes = await client.exportSnapshot(collection);
  assertSnapshotMatches(bytes, config);
  assertSnapshotSize(bytes.length, maxBytes);
  log(`[snapshot] format ${SNAPSHOT_FORMAT}, ${bytes.length} bytes, config matches the jsonl header (${Date.now() - started} ms)`);
  return bytes;
}
