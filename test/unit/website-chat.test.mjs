// website-chat.test.mjs — the action's website-chat emitter
// (src/website-chat.mjs) against a real file tree. The wasm cache is
// pre-seeded with checksum-correct files so no test touches the network; the
// download path is the same verifyChecksum call checksum.test.mjs proves.

import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sha256Hex } from '../../src/util.mjs';
import {
  buildManifest, emitWebsiteChat, LIBRARY_DIR, LIBRARY_FILES, libraryVersion, MANIFEST_NAME, WASM_CHECKSUMS, WASM_FILES,
} from '../../src/website-chat.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'autoreporag-chat-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const VERSION = 'v9.8.7';
const BYTES = {
  'repo-chat.js': 'export function openRepoChat() {}\n',
  'repo-chat.css': '.cc { color: var(--arr-text); }\n',
  'lattice_server.js': 'export default async function init() {}\n',
  'lattice_server_bg.wasm': '\0asm fixture',
};

function fakeLibrary(name, { version = '2.1.0', dist = LIBRARY_FILES } = {}) {
  const dir = join(SCRATCH, name);
  mkdirSync(join(dir, 'dist'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ version }));
  for (const f of dist) writeFileSync(join(dir, 'dist', f), BYTES[f] ?? 'x');
  return dir;
}

function seededCache(name) {
  const cache = join(SCRATCH, name);
  mkdirSync(join(cache, VERSION), { recursive: true });
  const lines = WASM_FILES.map((f) => `${sha256Hex(BYTES[f])}  packages/lattice-db-js/wasm/${f}`);
  writeFileSync(join(cache, VERSION, WASM_CHECKSUMS), `${lines.join('\n')}\n`);
  for (const f of WASM_FILES) writeFileSync(join(cache, VERSION, f), BYTES[f]);
  return cache;
}

describe('emitWebsiteChat', () => {
  it('copies the library and the verified wasm pair, and pins every file in the manifest', async () => {
    const out = join(SCRATCH, 'out-a', 'chat');
    const { manifest, manifestFile } = await emitWebsiteChat({
      outDir: out, latticeVersion: VERSION, cacheDir: seededCache('cache-a'), libraryDir: fakeLibrary('lib-a'),
    });
    assert.deepEqual(readdirSync(out).sort(), [...LIBRARY_FILES, ...WASM_FILES, MANIFEST_NAME].sort());
    assert.equal(manifest.library_version, '2.1.0');
    assert.equal(manifest.lattice_version, VERSION);
    for (const [name, bytes] of Object.entries(BYTES)) {
      assert.equal(readFileSync(join(out, name), 'utf8'), bytes, `${name} copied byte for byte`);
      assert.equal(manifest.files[name], sha256Hex(bytes), `${name} pinned`);
    }
    assert.deepEqual(JSON.parse(readFileSync(manifestFile, 'utf8')), manifest);
  });

  it('emits byte-identical manifests for the same inputs (no timestamp)', async () => {
    const lib = fakeLibrary('lib-b');
    const cache = seededCache('cache-b');
    const a = await emitWebsiteChat({ outDir: join(SCRATCH, 'out-b1'), latticeVersion: VERSION, cacheDir: cache, libraryDir: lib });
    const b = await emitWebsiteChat({ outDir: join(SCRATCH, 'out-b2'), latticeVersion: VERSION, cacheDir: cache, libraryDir: lib });
    assert.equal(readFileSync(a.manifestFile, 'utf8'), readFileSync(b.manifestFile, 'utf8'));
  });

  it('refuses a dist that is not exactly the two library files', async () => {
    for (const [name, dist] of [['lib-c1', ['repo-chat.js']], ['lib-c2', [...LIBRARY_FILES, 'stray.map']]]) {
      await assert.rejects(
        emitWebsiteChat({ outDir: join(SCRATCH, `out-${name}`), latticeVersion: VERSION, cacheDir: seededCache(`cache-${name}`), libraryDir: fakeLibrary(name, { dist }) }),
        /website-chat\/dist must hold exactly repo-chat.js and repo-chat.css/,
      );
    }
  });

  for (const bad of ['latest', '0.3.3', 'v0.3', 'main']) {
    it(`refuses an unpinned lattice-version (${bad})`, async () => {
      await assert.rejects(
        emitWebsiteChat({ outDir: join(SCRATCH, 'out-d'), latticeVersion: bad, cacheDir: seededCache('cache-d'), libraryDir: fakeLibrary('lib-d') }),
        /needs a pinned lattice-version tag/,
      );
    });
  }

  it('refuses a library package.json without an x.y.z version', () => {
    assert.throws(() => libraryVersion(fakeLibrary('lib-e', { version: 'next' })), /no x.y.z version/);
  });
});

describe('buildManifest', () => {
  it('sorts files by name whatever order they were placed in', () => {
    const m = buildManifest({ libraryVersion: '1.0.0', latticeVersion: 'v1.0.0', files: { b: '2', a: '1' } });
    assert.deepEqual(Object.keys(m.files), ['a', 'b']);
  });
});

describe('the committed library', () => {
  it('ships exactly the two built files the emitter copies', () => {
    assert.deepEqual(readdirSync(join(LIBRARY_DIR, 'dist')).sort(), [...LIBRARY_FILES].sort());
  });

  it('carries the version the manifest will name', () => {
    const pkg = JSON.parse(readFileSync(join(LIBRARY_DIR, 'package.json'), 'utf8'));
    assert.equal(libraryVersion(LIBRARY_DIR), pkg.version);
  });
});
