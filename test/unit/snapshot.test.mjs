// snapshot.test.mjs — snapshot header parsing and the size guard (pure).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { assertSnapshotSize, assertSnapshotMatches, parseSnapshotHeader } from '../../src/snapshot.mjs';

/** "LTDB" | u32 LE format | u32 LE config_len | config JSON | body */
function snapshotBytes(format, config, body = Buffer.alloc(8)) {
  const json = Buffer.from(JSON.stringify(config));
  const head = Buffer.alloc(12);
  head.write('LTDB', 0, 'latin1');
  head.writeUInt32LE(format, 4);
  head.writeUInt32LE(json.length, 8);
  return Buffer.concat([head, json, body]);
}

const CONFIG = { name: 'site', hnsw: { m: 16 }, relations: { next: 0 }, text_index: { field: 'text', k1: 1.2, b: 0.75 } };

describe('parseSnapshotHeader', () => {
  it('reads the format and the config JSON', () => {
    assert.deepEqual(parseSnapshotHeader(snapshotBytes(2, CONFIG)), { format: 2, config: CONFIG });
  });

  it('rejects bytes without the LTDB magic', () => {
    assert.throws(() => parseSnapshotHeader(Buffer.from('{"not":"a snapshot"}')), { message: /not a LatticeDB snapshot \(no "LTDB" magic\)/ });
  });

  it('rejects a config length past the end', () => {
    const b = snapshotBytes(2, CONFIG);
    b.writeUInt32LE(1e6, 8);
    assert.throws(() => parseSnapshotHeader(b), { message: /config length 1000000 runs past the end/ });
  });
});

describe('assertSnapshotMatches', () => {
  it('accepts format 2 with the same config, whatever the key order', () => {
    const reordered = { text_index: { b: 0.75, k1: 1.2, field: 'text' }, relations: { next: 0 }, hnsw: { m: 16 }, name: 'site' };
    assert.doesNotThrow(() => assertSnapshotMatches(snapshotBytes(2, reordered), CONFIG));
  });

  it('refuses another format', () => {
    assert.throws(() => assertSnapshotMatches(snapshotBytes(1, CONFIG), CONFIG), { message: /snapshot format 1, expected 2/ });
  });

  it('refuses a config that differs from the jsonl header, showing both', () => {
    const drift = { ...CONFIG, relations: { next: 1 } };
    assert.throws(
      () => assertSnapshotMatches(snapshotBytes(2, drift), CONFIG),
      { message: /snapshot config differs from the jsonl header config:\n {2}snapshot: .*"next":1.*\n {2}jsonl: {4}.*"next":0/ },
    );
  });
});

describe('assertSnapshotSize', () => {
  it('passes at the limit', () => assert.doesNotThrow(() => assertSnapshotSize(100, 100)));

  it('fails over the limit naming both sizes in bytes and MiB', () => {
    assert.throws(
      () => assertSnapshotSize(27_262_976, 26_214_400),
      { message: /^snapshot is 27262976 bytes \(26\.00 MiB\), over max-snapshot-bytes 26214400 \(25\.00 MiB\)/ },
    );
  });
});
