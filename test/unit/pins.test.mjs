// pins.test.mjs — release asset platforms and the pinned sha256 table (pure).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { assertPinned, PINNED_SHA256, serverAsset } from '../../src/pins.mjs';

describe('serverAsset', () => {
  for (const [platform, arch, name] of [
    ['linux', 'x64', 'lattice-db-linux-x64'],
    ['linux', 'arm64', 'lattice-db-linux-arm64'],
    ['darwin', 'arm64', 'lattice-db-macos-arm64'],
    ['darwin', 'x64', 'lattice-db-macos-x64'],
  ]) {
    it(`${platform}/${arch} -> ${name}`, () => {
      assert.deepEqual(serverAsset(platform, arch), { archive: `${name}.tar.gz`, checksums: `${name}.sha256` });
    });
  }

  it('refuses other platforms and architectures, naming them', () => {
    assert.throws(() => serverAsset('win32', 'x64'), { message: /unsupported platform "win32"/ });
    assert.throws(() => serverAsset('linux', 'ia32'), { message: /unsupported CPU architecture "ia32"/ });
  });
});

describe('pinned sha256 table', () => {
  it('pins every v0.5.0 server archive and the wasm pair as 64-hex', () => {
    const v5 = PINNED_SHA256['v0.5.0'];
    assert.deepEqual(Object.keys(v5).sort(), [
      'lattice-db-linux-arm64.tar.gz', 'lattice-db-linux-x64.tar.gz', 'lattice-db-macos-arm64.tar.gz',
      'lattice-db-macos-x64.tar.gz', 'lattice_server.js', 'lattice_server_bg.wasm',
    ]);
    for (const h of Object.values(v5)) assert.match(h, /^[0-9a-f]{64}$/);
    assert.ok(Object.isFrozen(PINNED_SHA256) && Object.isFrozen(v5));
  });

  it('accepts the pinned hash and an unpinned version', () => {
    const pinned = PINNED_SHA256['v0.5.0']['lattice_server.js'];
    assert.doesNotThrow(() => assertPinned('v0.5.0', 'lattice_server.js', pinned));
    assert.doesNotThrow(() => assertPinned('v0.3.3', 'lattice_server.js', '0'.repeat(64)));
  });

  it('refuses a pinned version whose asset hash differs, even if the release checksum agreed', () => {
    assert.throws(
      () => assertPinned('v0.5.0', 'lattice-db-linux-x64.tar.gz', 'f'.repeat(64)),
      { message: /lattice-db-linux-x64\.tar\.gz \(v0\.5\.0\) has sha256 f{64}, but this action pins 25e83007/ },
    );
  });

  it('refuses an asset a pinned version does not list', () => {
    assert.throws(() => assertPinned('v0.5.0', 'lattice-db-windows-x64.zip', 'a'.repeat(64)), { message: /pins no sha256 for lattice-db-windows-x64\.zip/ });
  });
});
