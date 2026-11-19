// files.mjs — which files under a root are candidates for chunking.
//
// Contract: two listings. "git" (a repository or source-dir checkout) asks
// `git ls-files` for tracked + untracked non-ignored files, so .gitignore is
// honoured, and falls back to a walk when root is not a git checkout. "walk"
// (files-dir: a build output such as dist/, usually gitignored) never asks
// git — git would hide exactly the files it was given — and walks the tree,
// skipping .git and symlinks. Paths are posix-relative to root; globs are
// applied by selectFiles and the result is sorted (code-unit order).

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compileMatcher } from './util.mjs';

/** @typedef {'git'|'walk'} Listing */

/** Every regular file under root, skipping .git directories and symlinks. */
export function walkFiles(root) {
  const files = [];
  const walk = (rel) => {
    const entries = readdirSync(join(root, rel), { withFileTypes: true });
    for (const e of entries) {
      if (e.isSymbolicLink()) continue;
      const childRel = rel === '' ? e.name : `${rel}/${e.name}`;
      if (e.isDirectory()) {
        if (e.name === '.git') continue;
        walk(childRel);
      } else if (e.isFile()) {
        files.push(childRel);
      }
    }
  };
  walk('');
  return files;
}

/** Tracked + untracked non-ignored files; the walk when root is not a git checkout. */
export function listRepoFiles(root) {
  try {
    const out = execFileSync(
      'git',
      ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
    );
    return [...new Set(out.split('\0').filter((p) => p !== ''))];
  } catch {
    return walkFiles(root);
  }
}

/**
 * Apply include/exclude globs to the listing; sorted ascending.
 * @param {{root: string, includeGlobs: string[], excludeGlobs: string[], listing: Listing}} opts
 */
export function selectFiles({ root, includeGlobs, excludeGlobs, listing }) {
  const include = compileMatcher(includeGlobs);
  const exclude = excludeGlobs.length > 0 ? compileMatcher(excludeGlobs) : () => false;
  const all = listing === 'walk' ? walkFiles(root) : listRepoFiles(root);
  return all.filter((p) => include(p) && !exclude(p)).sort();
}

/** A file is binary if its first 8 KiB contain a NUL byte. */
export function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}
