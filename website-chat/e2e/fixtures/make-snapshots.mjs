// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// make-snapshots.mjs — generates the checked-in search-mode fixtures, in the
// shape the action publishes in v3 mode:
//   site.lattice + site.meta.json     lexical (BM25 only), snapshot format 2
//   guide.lattice + guide.meta.json   hybrid: BM25 + 8-d vectors from the
//                                     shared fake embedder (embed.mjs)
// The snapshots are written by the LatticeDB engine itself (exportSnapshot),
// so it needs a lattice-db >= v0.5.0 wasm pair, e.g. the emitted one:
//   node e2e/fixtures/make-snapshots.mjs e2e/.site/repo-chat-search
// Fixed commit shas and timestamps; points are upserted in a fixed order.
// =============================================================================

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { GUIDE_PAGES, SITE_PAGES } from './chunks-site.mjs';
import { embedText } from './embed.mjs';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
const GENERATED_AT = '2026-11-19T00:00:00Z';
export const SEARCH_MODEL = 'test/embed-8';
const DIM = 8;

const SPECS = {
  site: { repo: 'example-org/site', commit: 'd4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5', pages: SITE_PAGES, mode: 'lexical' },
  guide: { repo: 'example-org/guide', commit: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4', pages: GUIDE_PAGES, mode: 'hybrid' },
};

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function engine(dir) {
  if (!dir) throw new Error('usage: node e2e/fixtures/make-snapshots.mjs <dir with a lattice-db >= v0.5.0 lattice_server.js + lattice_server_bg.wasm>');
  const mod = await import(pathToFileURL(join(dir, 'lattice_server.js')).href);
  await mod.default({ module_or_path: readFileSync(join(dir, 'lattice_server_bg.wasm')) });
  return new mod.LatticeDB();
}

async function call(db, method, path, body) {
  const res = await db.route(method, path, JSON.stringify(body));
  if (res.status !== 200) throw new Error(`${method} ${path}: HTTP ${res.status} ${new TextDecoder().decode(res.body)}`);
}

async function build(db, id, { repo, commit, pages, mode }) {
  const hybrid = mode === 'hybrid';
  const points = pages.map(([path, url, title, headingPath, startLine, text], i) => ({
    id: i + 1,
    ...(hybrid ? { vector: embedText(text, DIM) } : {}),
    payload: {
      chunk_hash: sha256(text).slice(0, 16),
      commit_sha: commit,
      end_line: startLine + text.split('\n').length - 1,
      heading_path: headingPath,
      language: 'markdown',
      lastmod: '2026-11-01',
      path,
      repo,
      start_line: startLine,
      text,
      title,
      url,
    },
  }));
  await call(db, 'PUT', `/collections/${id}`, {
    text_index: { field: 'text', k1: 1.2, b: 0.75 },
    ...(hybrid ? { vectors: { size: DIM, distance: 'Cosine', index: 'flat', storage: 'f16' }, embedding: { model: SEARCH_MODEL } } : {}),
    durability: 'ephemeral',
  });
  await call(db, 'PUT', `/collections/${id}/points`, { points });
  const snapshot = db.exportSnapshot(id);
  const meta = {
    action_version: 'v3.0.0',
    bytes: 0,
    chunk_strategy: 'markdown',
    commit_sha: commit,
    dim: hybrid ? DIM : 0,
    edges: 0,
    embedded: hybrid ? points.length : 0,
    endpoint: null,
    files: new Set(pages.map(([p]) => p)).size,
    format: 'lattice-jsonl',
    generated_at: GENERATED_AT,
    gz_bytes: 0,
    lattice_version: 'v0.5.0',
    model: hybrid ? SEARCH_MODEL : null,
    points: points.length,
    repo,
    reused: 0,
    search_mode: mode,
    sha256: '0'.repeat(64),
    snapshot_bytes: snapshot.byteLength,
    snapshot_format: 2,
    snapshot_sha256: sha256(snapshot),
    text_field: 'text',
    vector_index: hybrid ? 'flat' : null,
    vector_storage: hybrid ? 'f16' : null,
    version: 1,
  };
  writeFileSync(join(OUT_DIR, `${id}.lattice`), snapshot);
  writeFileSync(join(OUT_DIR, `${id}.meta.json`), JSON.stringify(meta, null, 2) + '\n');
  console.log(`${id}: ${points.length} points, ${mode}, snapshot ${snapshot.byteLength} bytes`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = await engine(process.argv[2] && resolve(process.argv[2]));
  for (const [id, spec] of Object.entries(SPECS)) await build(db, id, spec);
}
