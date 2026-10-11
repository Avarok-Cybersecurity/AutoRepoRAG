#!/usr/bin/env node
// emit-website-chat.mjs — emit the website-chat bundle outside the action:
// the same emitWebsiteChat() the action runs (src/website-chat.mjs), used by
// the library's browser suite and by the release workflow's tarball.
//
// Usage: node scripts/emit-website-chat.mjs <lattice-version> <out-dir> <cache-dir>
//   lattice-version  pinned lattice-db tag whose wasm pair is downloaded and verified
//   out-dir          where repo-chat.{js,css}, the wasm pair and the manifest land
//   cache-dir        where verified wasm downloads are kept between runs

import { resolve } from 'node:path';

import { emitWebsiteChat, LIBRARY_DIR } from '../src/website-chat.mjs';

const [latticeVersion, outDir, cacheDir] = process.argv.slice(2);
if (!latticeVersion || !outDir || !cacheDir || process.argv.length !== 5) {
  console.error('usage: node scripts/emit-website-chat.mjs <lattice-version> <out-dir> <cache-dir>');
  process.exit(2);
}

try {
  const { manifestFile } = await emitWebsiteChat({
    outDir: resolve(outDir),
    latticeVersion,
    cacheDir: resolve(cacheDir),
    libraryDir: LIBRARY_DIR,
  });
  console.log(manifestFile);
} catch (e) {
  console.error(`emit-website-chat: ${e.message}`);
  process.exit(1);
}
