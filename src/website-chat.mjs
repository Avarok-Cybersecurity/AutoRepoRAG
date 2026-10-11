// website-chat.mjs — emit the "Talk to the Repo" website-chat bundle.
//
// Contract: copies the prebuilt library (website-chat/dist/*, committed and
// rebuilt-and-diffed by CI) plus the LatticeDB wasm pair into outDir, and
// writes repo-chat.manifest.json naming the library version, the lattice
// version and every file's sha256. The wasm pair is downloaded from the
// pinned lattice-db release and verified against that release's
// lattice-db-wasm.sha256 (src/checksum.mjs, the same check the server binary
// gets); a cached pair is re-verified before reuse. The manifest has no
// timestamp, so the same inputs emit the same bytes.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyChecksum } from './checksum.mjs';
import { download, releaseUrl } from './server.mjs';
import { log, sha256Hex, stableStringify } from './util.mjs';

export const LIBRARY_DIR = fileURLToPath(new URL('../website-chat/', import.meta.url));
export const WASM_FILES = Object.freeze(['lattice_server.js', 'lattice_server_bg.wasm']);
export const WASM_CHECKSUMS = 'lattice-db-wasm.sha256';
export const MANIFEST_NAME = 'repo-chat.manifest.json';
export const LIBRARY_FILES = Object.freeze(['repo-chat.js', 'repo-chat.css']);

const PINNED_TAG = /^v\d+\.\d+\.\d+$/;

/** The manifest object for a set of emitted files. Pure. */
export function buildManifest({ libraryVersion, latticeVersion, files }) {
  return {
    format: 'repo-chat-manifest',
    version: 1,
    library_version: libraryVersion,
    lattice_version: latticeVersion,
    files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1))),
  };
}

/** The library version, from website-chat/package.json (its only source). */
export function libraryVersion(libraryDir) {
  const { version } = JSON.parse(readFileSync(join(libraryDir, 'package.json'), 'utf8'));
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`website-chat/package.json has no x.y.z version (got ${JSON.stringify(version)})`);
  }
  return version;
}

/**
 * Download (or reuse a cached copy of) the wasm pair of `version` into
 * cacheDir, each verified against the release's checksum file.
 */
export async function fetchLatticeWasm(version, cacheDir) {
  if (!PINNED_TAG.test(version)) {
    throw new Error(`the website chat needs a pinned lattice-version tag like v0.3.3, got ${JSON.stringify(version)}`);
  }
  const dir = join(cacheDir, version);
  mkdirSync(dir, { recursive: true });
  const checksums = join(dir, WASM_CHECKSUMS);
  if (!existsSync(checksums)) await download(releaseUrl(version, WASM_CHECKSUMS), checksums);
  for (const name of WASM_FILES) {
    const path = join(dir, name);
    if (existsSync(path) && verifyChecksum(path, checksums, name).ok) {
      log(`[website-chat] using cached ${name} (${version}, sha256 re-verified)`);
      continue;
    }
    log(`[website-chat] downloading ${name} (${version})`);
    await download(releaseUrl(version, name), path);
    const check = verifyChecksum(path, checksums, name);
    if (!check.ok) throw new Error(`sha256 verification failed for ${name} (${version}): ${check.detail}`);
  }
  return dir;
}

/**
 * Emit the bundle into outDir. Returns { dir, manifestFile, manifest }.
 * @param {{ outDir: string, latticeVersion: string, cacheDir: string, libraryDir: string }} opts
 */
export async function emitWebsiteChat({ outDir, latticeVersion, cacheDir, libraryDir }) {
  const distDir = join(libraryDir, 'dist');
  const built = existsSync(distDir) ? readdirSync(distDir).sort() : [];
  if (stableStringify(built) !== stableStringify([...LIBRARY_FILES].sort())) {
    throw new Error(`website-chat/dist must hold exactly ${LIBRARY_FILES.join(' and ')}, found ${JSON.stringify(built)}`);
  }
  const wasmDir = await fetchLatticeWasm(latticeVersion, cacheDir);

  mkdirSync(outDir, { recursive: true });
  const files = {};
  const place = (from, name) => {
    copyFileSync(from, join(outDir, name));
    files[name] = sha256Hex(readFileSync(join(outDir, name)));
  };
  for (const name of LIBRARY_FILES) place(join(distDir, name), name);
  for (const name of WASM_FILES) place(join(wasmDir, name), name);

  const manifest = buildManifest({ libraryVersion: libraryVersion(libraryDir), latticeVersion, files });
  const manifestFile = join(outDir, MANIFEST_NAME);
  writeFileSync(manifestFile, `${JSON.stringify(JSON.parse(stableStringify(manifest)), null, 2)}\n`);
  log(`[website-chat] emitted ${Object.keys(files).length} files + ${MANIFEST_NAME} into ${outDir}`);
  return { dir: outDir, manifestFile, manifest };
}
