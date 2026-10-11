#!/usr/bin/env node
// website-chat-check.mjs — prove the action emitted a usable website-chat
// bundle: exactly the library pair, the wasm pair and the manifest; every
// file hashed in the manifest as it is on disk; the library bytes equal to
// the committed website-chat/dist; the versions named correctly; and the
// wasm pair equal to the bytes lattice-db publishes for that tag.
//
// Independent of src/ on purpose (imports nothing from it): a bug in the
// emitter must not be able to vouch for itself.
//
// Usage: node test/website-chat-check.mjs <emitted-dir> <lattice-version> <wasm-sha256-file>
//   wasm-sha256-file  the release's lattice-db-wasm.sha256, fetched separately

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function fail(msg) {
  process.stderr.write(`website-chat-check: FAIL: ${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length !== 3) {
  process.stderr.write('usage: node test/website-chat-check.mjs <emitted-dir> <lattice-version> <wasm-sha256-file>\n');
  process.exit(2);
}
const [dir, latticeVersion, wasmSums] = args;
const LIBRARY = fileURLToPath(new URL('../website-chat/', import.meta.url));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

const want = ['lattice_server.js', 'lattice_server_bg.wasm', 'repo-chat.css', 'repo-chat.js', 'repo-chat.manifest.json'];
const got = readdirSync(dir).sort();
if (JSON.stringify(got) !== JSON.stringify(want)) fail(`emitted files ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const manifest = JSON.parse(readFileSync(join(dir, 'repo-chat.manifest.json'), 'utf8'));
if (manifest.format !== 'repo-chat-manifest' || manifest.version !== 1) fail(`unexpected manifest format ${manifest.format} v${manifest.version}`);
const pkg = JSON.parse(readFileSync(join(LIBRARY, 'package.json'), 'utf8'));
if (manifest.library_version !== pkg.version) fail(`library_version ${manifest.library_version} != website-chat/package.json ${pkg.version}`);
if (manifest.lattice_version !== latticeVersion) fail(`lattice_version ${manifest.lattice_version} != ${latticeVersion}`);

const files = want.filter((f) => f !== 'repo-chat.manifest.json');
if (JSON.stringify(Object.keys(manifest.files).sort()) !== JSON.stringify(files)) fail(`manifest names ${Object.keys(manifest.files)}`);
for (const f of files) {
  const actual = sha(readFileSync(join(dir, f)));
  if (manifest.files[f] !== actual) fail(`${f}: manifest says ${manifest.files[f]}, file is ${actual}`);
}
for (const f of ['repo-chat.js', 'repo-chat.css']) {
  if (sha(readFileSync(join(LIBRARY, 'dist', f))) !== manifest.files[f]) fail(`${f} differs from the committed website-chat/dist/${f}`);
}
const published = new Map(
  readFileSync(wasmSums, 'utf8').trim().split('\n').map((l) => {
    const [hash, path] = l.trim().split(/\s+/);
    return [path.split('/').pop(), hash];
  }),
);
for (const f of ['lattice_server.js', 'lattice_server_bg.wasm']) {
  if (published.get(f) !== manifest.files[f]) fail(`${f}: ${manifest.files[f]} is not the ${latticeVersion} release's ${published.get(f)}`);
}
process.stdout.write(`website-chat-check: OK (${files.length} files, library ${manifest.library_version}, lattice ${manifest.lattice_version})\n`);
