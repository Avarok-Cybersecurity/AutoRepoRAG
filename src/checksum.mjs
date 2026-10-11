// checksum.mjs — verify a downloaded release asset against its release's
// sha256sum-format checksum file.
//
// Contract: expectedSha256 is pure; verifyChecksum reads the two files. A
// checksum line is `<64 hex>  <path>` (sha256sum text or `*` binary mode);
// the asset is matched by the path's BASENAME exactly, because lattice-db's
// wasm checksums name build paths (packages/lattice-db-js/wasm/<file>)
// while its server checksums name bare files. No line, or two lines that
// disagree, is a failure: the asset is never trusted by default.

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

import { sha256Hex } from './util.mjs';

const LINE = /^([0-9a-fA-F]{64}) [ *](.+)$/;

/** The sha256 the checksum file pins for `asset`. Throws when it pins none or several. */
export function expectedSha256(checksumsText, asset) {
  const pinned = new Set();
  for (const raw of checksumsText.split('\n')) {
    const m = LINE.exec(raw.trim());
    if (m && basename(m[2].trim()) === asset) pinned.add(m[1].toLowerCase());
  }
  if (pinned.size === 0) throw new Error(`the checksum file has no line for ${asset}`);
  if (pinned.size > 1) throw new Error(`the checksum file pins ${asset} to ${pinned.size} different hashes`);
  return [...pinned][0];
}

/**
 * Verify `filePath` (release asset `asset`) against `checksumsPath`.
 * @returns {{ ok: boolean, sha256: string|null, detail: string }}
 */
export function verifyChecksum(filePath, checksumsPath, asset) {
  try {
    const want = expectedSha256(readFileSync(checksumsPath, 'utf8'), asset);
    const got = sha256Hex(readFileSync(filePath));
    if (got !== want) return { ok: false, sha256: got, detail: `${asset}: FAILED (expected ${want}, got ${got})` };
    return { ok: true, sha256: got, detail: `${asset}: OK` };
  } catch (e) {
    return { ok: false, sha256: null, detail: `${asset}: ${e.code ?? ''}${e.code ? ' ' : ''}${e.message}` };
  }
}
