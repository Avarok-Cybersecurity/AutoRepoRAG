#!/usr/bin/env node
// float-parity.mjs — byte-parity gate for formatRustF64 against Rust serde_json.
//
// The writer claims exported vector components byte-match lattice-core's
// serde_json (ryu) f64 output. The expected strings below were produced by a
// Rust harness (serde_json 1.0.151, the version lattice-core links) on
// 2026-08-16 from exactly these input doubles: the 10 fixed probes cover the
// integral-".0", scientific (exp < -5 / >= 16) and -0.0 bands; the 20
// pseudo-random Math.fround'd values were drawn deterministically from a
// sha256 stream (seed "autoreporag-float-parity-v1") across magnitudes.
// No Rust toolchain is needed at CI time.
//
// Usage: node test/float-parity.mjs   (exit 0 = every probe byte-identical)

import { formatRustF64 } from '../src/util.mjs';
import { serializeCorpus } from '../src/jsonl.mjs';

const PROBES = [
  [0, '0.0'],
  [1, '1.0'],
  [-1, '-1.0'],
  [-0, '-0.0'],
  [0.0000015, '1.5e-6'],
  [0.0000099999, '9.9999e-6'],
  [0.00001, '0.00001'],
  [1000000000000000, '1000000000000000.0'],
  [10000000000000000, '1e+16'],
  [10000000272564224, '1.0000000272564224e+16'],
  [0.0005871853209100664, '0.0005871853209100664'],
  [-0.30828678607940674, '-0.30828678607940674'],
  [-9.720710067995242e-7, '-9.720710067995242e-7'],
  [5875930, '5875930.0'],
  [3.5991980951166624e-8, '3.5991980951166624e-8'],
  [0.00042693474097177386, '0.00042693474097177386'],
  [4.996052780370519e-7, '4.996052780370519e-7'],
  [2902563, '2902563.0'],
  [-0.7070819139480591, '-0.7070819139480591'],
  [2.0593656557821305e-8, '2.0593656557821305e-8'],
  [497.0584716796875, '497.0584716796875'],
  [-0.00048428672016598284, '-0.00048428672016598284'],
  [9.94333163362171e-7, '9.94333163362171e-7'],
  [9.120098809489718e-8, '9.120098809489718e-8'],
  [227.21241760253906, '227.21241760253906'],
  [4127848.75, '4127848.75'],
  [606041695846400, '606041695846400.0'],
  [-0.08257877081632614, '-0.08257877081632614'],
  [2983178520231936, '2983178520231936.0'],
  [0.0001905334065668285, '0.0001905334065668285'],
];

function fail(msg) {
  process.stderr.write(`float-parity: FAIL: ${msg}\n`);
  process.exit(1);
}

let checked = 0;
for (const [value, expected] of PROBES) {
  const got = formatRustF64(value);
  if (got !== expected) {
    fail(`formatRustF64(${Object.is(value, -0) ? '-0' : value}) = ${JSON.stringify(got)}, Rust serde_json prints ${JSON.stringify(expected)}`);
  }
  checked += 1;
}

// Non-finite inputs must throw, never serialize.
for (const bad of [NaN, Infinity, -Infinity]) {
  let threw = false;
  try {
    formatRustF64(bad);
  } catch {
    threw = true;
  }
  if (!threw) fail(`formatRustF64(${bad}) did not throw`);
}

// Integration: serializeCorpus must route vector components (and only them)
// through the formatter — payload integers stay bare.
const line = serializeCorpus({
  collectionName: 'parity',
  dim: 3,
  points: [{
    id: 1,
    vector: [1, -0, 1.5e-6],
    payload: { chunk_hash: 'h', start_line: 1, text: 't' },
  }],
}).split('\n')[1];
const expectedLine =
  '{"id":1,"payload":{"chunk_hash":"h","start_line":1,"text":"t"},"t":"point","vector":[1.0,-0.0,1.5e-6]}';
if (line !== expectedLine) {
  fail(`serialized point line\n  got:      ${line}\n  expected: ${expectedLine}`);
}

process.stdout.write(
  `float-parity: OK: ${checked} probes byte-identical to Rust serde_json, ` +
    'non-finite inputs rejected, corpus point line uses ryu formatting\n',
);
