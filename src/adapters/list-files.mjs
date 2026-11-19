// list-files.mjs — the file-listing adapter: which files exist under a root.
//
// Contract: two listings. "git" (a repository or source-dir checkout) asks
// `git ls-files` for tracked + untracked non-ignored files, so .gitignore is
// honoured, and falls back to a walk when root is not a git checkout. "walk"
// (files-dir: a build output such as dist/, usually gitignored) never asks
// git — git would hide exactly the files it was given — and walks the tree,
// skipping .git and symlinks. Paths are posix-relative to root, unsorted;
// src/files.mjs selectFiles filters and sorts them.

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

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

/** @param {'git'|'walk'} listing */
export function listFiles(root, listing) {
  if (listing === 'walk') return walkFiles(root);
  if (listing === 'git') return listRepoFiles(root);
  throw new Error(`unknown file listing ${JSON.stringify(listing)}`);
}
