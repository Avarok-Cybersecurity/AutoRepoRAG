// chunk.mjs — repository file discovery and deterministic line-window chunking.
//
// Contract: expand include globs against `git ls-files` output (fs walk
// fallback), drop excluded and binary (NUL-sniffed) files, split each text
// file into windows of `chunkLines` lines advancing by (chunkLines - overlap),
// preferring a break after a blank line or a column-0 '}' within the window's
// tail 25%, capped at maxChunkBytes. Chunk ids are ordinals assigned in
// (path asc, start_line asc) order. chunk_hash = sha256(path \0 start_line \0 text).

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileMatcher, sha256Hex, warning } from './util.mjs';

export const LANGUAGE_BY_EXT = {
  rs: 'rust',
  cu: 'cuda',
  cuh: 'cuda',
  ptx: 'ptx',
  h: 'c',
  c: 'c',
  hpp: 'cpp',
  hh: 'cpp',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  metal: 'metal',
  cl: 'opencl',
  wgsl: 'wgsl',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  py: 'python',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  rb: 'ruby',
  cs: 'csharp',
  svelte: 'svelte',
  vue: 'vue',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  sql: 'sql',
  md: 'markdown',
  toml: 'toml',
  yaml: 'yaml',
  yml: 'yaml',
  json: 'json',
  proto: 'protobuf',
  cmake: 'cmake',
  css: 'css',
  scss: 'css',
  html: 'html',
};

export function languageForPath(path) {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return 'text';
  const ext = base.slice(dot + 1).toLowerCase();
  return LANGUAGE_BY_EXT[ext] ?? ext;
}

/**
 * Enumerate candidate files relative to root. Prefers git (tracked + untracked
 * non-ignored, so .gitignore is honoured); falls back to an fs walk that skips
 * .git and symlinks when root is not a git checkout.
 */
export function listRepoFiles(root) {
  try {
    const out = execFileSync(
      'git',
      ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
    );
    return [...new Set(out.split('\0').filter((p) => p !== ''))];
  } catch {
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
}

/** Apply include/exclude globs; result sorted ascending (code-unit order). */
export function selectFiles({ root, includeGlobs, excludeGlobs }) {
  const include = compileMatcher(includeGlobs);
  const exclude = excludeGlobs.length > 0 ? compileMatcher(excludeGlobs) : () => false;
  return listRepoFiles(root)
    .filter((p) => include(p) && !exclude(p))
    .sort();
}

/** A file is binary if its first 8 KiB contain a NUL byte. */
export function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

/** Truncate a string to at most maxBytes of UTF-8 without splitting a code point. */
function truncateUtf8(s, maxBytes) {
  const full = Buffer.from(s, 'utf8');
  if (full.length <= maxBytes) return s;
  let buf = full.subarray(0, maxBytes);
  // Walk back over trailing continuation bytes to the sequence's lead byte,
  // then drop the sequence only if the cut left it incomplete (the lead
  // byte's declared length exceeds the bytes actually present).
  let i = buf.length - 1;
  while (i >= 0 && (buf[i] & 0xc0) === 0x80) i -= 1;
  if (i >= 0 && buf[i] >= 0xc0) {
    const lead = buf[i];
    const expected = lead >= 0xf0 ? 4 : lead >= 0xe0 ? 3 : 2;
    if (expected > buf.length - i) buf = buf.subarray(0, i);
  }
  return buf.toString('utf8');
}

/**
 * Split text into line windows. Returns [{startLine, endLine, text}] with
 * 1-based inclusive line numbers.
 */
export function chunkText(text, { chunkLines, chunkOverlap, maxChunkBytes }) {
  if (chunkOverlap >= chunkLines) {
    throw new Error(`chunk-overlap (${chunkOverlap}) must be < chunk-lines (${chunkLines})`);
  }
  const lines = text.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  if (lines.length === 0) return [];

  const tailSpan = Math.max(1, Math.floor(chunkLines * 0.25));
  const chunks = [];
  let start = 0;
  for (;;) {
    let end = Math.min(start + chunkLines, lines.length);
    if (end < lines.length) {
      // Prefer to end just after a blank line or a column-0 '}' in the tail 25%.
      for (let i = end - 1; i >= Math.max(end - tailSpan, start + 1); i--) {
        const line = lines[i];
        if (line.trim() === '' || line.startsWith('}')) {
          end = i + 1;
          break;
        }
      }
    }
    let slice = lines.slice(start, end);
    let body = slice.join('\n');
    while (Buffer.byteLength(body, 'utf8') > maxChunkBytes && slice.length > 1) {
      slice = slice.slice(0, -1);
      body = slice.join('\n');
    }
    if (Buffer.byteLength(body, 'utf8') > maxChunkBytes) {
      body = truncateUtf8(body, maxChunkBytes); // single oversized line
    }
    const cappedEnd = start + slice.length;
    chunks.push({ startLine: start + 1, endLine: cappedEnd, text: body });
    if (cappedEnd >= lines.length) break;
    const next = cappedEnd - chunkOverlap;
    start = next > start ? next : cappedEnd; // always advance, keep overlap when possible
  }
  return chunks;
}

/**
 * Full chunking pass. Returns:
 *   chunks: [{id, chunkHash, payload}] with ordinal ids in (path, start_line) order
 *   fileCount: files that produced at least one chunk
 *   skippedBinary: paths dropped by the NUL sniff
 *   truncated: whether maxChunks clipped the list
 */
export function buildChunks({
  root,
  includeGlobs,
  excludeGlobs,
  chunkLines,
  chunkOverlap,
  maxChunkBytes,
  maxChunks,
  repo,
  commitSha,
}) {
  const files = selectFiles({ root, includeGlobs, excludeGlobs });
  const raw = [];
  const skippedBinary = [];
  for (const path of files) {
    const abs = join(root, path);
    if (!existsSync(abs)) {
      // `git ls-files --cached` lists files staged but deleted from the worktree.
      warning(`skipping ${path}: tracked but missing from the worktree`);
      continue;
    }
    const buf = readFileSync(abs);
    if (isBinary(buf)) {
      skippedBinary.push(path);
      continue;
    }
    for (const c of chunkText(buf.toString('utf8'), { chunkLines, chunkOverlap, maxChunkBytes })) {
      raw.push({ path, ...c });
    }
  }
  // Files are iterated in sorted order and windows ascend by startLine, so
  // `raw` is already in (path asc, start_line asc) order.
  let truncated = false;
  if (maxChunks > 0 && raw.length > maxChunks) {
    raw.length = maxChunks;
    truncated = true;
  }
  const seen = new Set();
  const chunks = raw.map((c, i) => {
    seen.add(c.path);
    const chunkHash = sha256Hex(`${c.path}\0${c.startLine}\0${c.text}`);
    return {
      id: i + 1,
      chunkHash,
      payload: {
        chunk_hash: chunkHash,
        commit_sha: commitSha,
        end_line: c.endLine,
        language: languageForPath(c.path),
        path: c.path,
        repo,
        start_line: c.startLine,
        text: c.text,
      },
    };
  });
  return { chunks, fileCount: seen.size, matchedFiles: files.length, skippedBinary, truncated };
}
