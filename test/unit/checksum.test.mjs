// checksum.test.mjs — release-asset verification (src/checksum.mjs), on the
// two checksum-file shapes lattice-db publishes, against real files.

import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expectedSha256, verifyChecksum } from '../../src/checksum.mjs';
import { sha256Hex } from '../../src/util.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'autoreporag-sum-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const H = (c) => c.repeat(64);

// lattice-db-wasm.sha256 names build paths; the server files name bare files.
const WASM_SUMS = [
  `${H('1')}  lattice-db-wasm-v0.3.3.tar.gz`,
  `${H('2')}  packages/lattice-db-js/wasm/lattice_server.js`,
  `${H('3')}  packages/lattice-db-js/wasm/lattice_server_bg.wasm`,
].join('\n');
const SERVER_SUMS = [
  `${H('4')}  lattice-db-linux-x64-v0.3.3.tar.gz`,
  `${H('5')}  lattice-db-linux-x64.tar.gz`,
  `${H('6')} *lattice-server-linux-x64`,
  `${H('7')}  lattice-db-linux-x64.tar.gz.asc`,
].join('\n');

describe('expectedSha256', () => {
  it('matches a build-path line by basename', () => {
    assert.equal(expectedSha256(WASM_SUMS, 'lattice_server.js'), H('2'));
    assert.equal(expectedSha256(WASM_SUMS, 'lattice_server_bg.wasm'), H('3'));
  });

  it('matches the exact basename, never a longer sibling name', () => {
    assert.equal(expectedSha256(SERVER_SUMS, 'lattice-db-linux-x64.tar.gz'), H('5'));
    assert.equal(expectedSha256(SERVER_SUMS, 'lattice-db-linux-x64-v0.3.3.tar.gz'), H('4'));
  });

  it('reads binary-mode (*) lines', () => {
    assert.equal(expectedSha256(SERVER_SUMS, 'lattice-server-linux-x64'), H('6'));
  });

  it('refuses an asset the file does not pin', () => {
    assert.throws(() => expectedSha256(WASM_SUMS, 'lattice_server.wasm'), /no line for lattice_server.wasm/);
  });

  it('refuses two lines that disagree', () => {
    assert.throws(() => expectedSha256(`${H('a')}  x/f.js\n${H('b')}  y/f.js`, 'f.js'), /2 different hashes/);
  });
});

describe('verifyChecksum', () => {
  const file = join(SCRATCH, 'lattice_server.js');
  const sums = join(SCRATCH, 'sums');
  writeFileSync(file, 'export default 1;\n');
  writeFileSync(sums, `${sha256Hex('export default 1;\n')}  packages/lattice-db-js/wasm/lattice_server.js\n`);

  it('accepts the pinned bytes', () => {
    const r = verifyChecksum(file, sums, 'lattice_server.js');
    assert.equal(r.ok, true, r.detail);
  });

  it('rejects a single changed byte', () => {
    const tampered = join(SCRATCH, 'tampered', 'lattice_server.js');
    mkdirSync(join(SCRATCH, 'tampered'), { recursive: true });
    writeFileSync(tampered, 'export default 2;\n');
    const r = verifyChecksum(tampered, sums, 'lattice_server.js');
    assert.equal(r.ok, false);
    assert.match(r.detail, /FAILED \(expected [0-9a-f]{64}, got [0-9a-f]{64}\)/);
  });

  it('fails, never passes, when the checksum file is missing', () => {
    const r = verifyChecksum(file, join(SCRATCH, 'absent'), 'lattice_server.js');
    assert.equal(r.ok, false);
    assert.match(r.detail, /ENOENT/);
  });
});
