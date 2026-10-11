// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// make-corpora.mjs — generates the checked-in fixture corpora for the E2E
// suite, in exactly the shape AutoRepoRAG publishes:
//   <id>.jsonl        valid lattice-jsonl v1, dim 8
//   <id>.jsonl.gz     the gzip the tests serve for the corpus URL
//   <id>.meta.json    the manifest the tests serve for the meta URL
// for id in { code, docs }: two repositories, one embedder, one dim.
//
// Fully deterministic: fixed commit shas, fixed timestamp, vectors from the
// shared fake embedder (embed.mjs), every JSON line written with sorted keys
// (matching lattice-core's interchange serializer). Re-run with
//   node e2e/fixtures/make-corpora.mjs
// and the bytes are identical unless a chunk table changes.
// =============================================================================

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { CODE_CHUNKS } from './chunks-code.mjs';
import { DOCS_CHUNKS } from './chunks-docs.mjs';
import { embedText } from './embed.mjs';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
const DIM = 8;
const GENERATED_AT = '2026-08-16T00:00:00Z';
export const MODEL = 'nvidia/llama-nemotron-embed-vl-1b-v2:free';

export const CORPORA = {
  code: { repo: 'example-org/engine', commit: 'a3f9c1e7b2d84056917e2c3a4b5d6f7089abcde1', chunks: CODE_CHUNKS },
  docs: { repo: 'example-org/handbook', commit: 'b7e2d4f6a8c0e1f3a5b7c9d1e3f5a7b9c1d3e5f7', chunks: DOCS_CHUNKS },
};

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeys(value[k])])
    );
  }
  return value;
}

const jsonLine = (obj) => JSON.stringify(sortKeys(obj));

function build(id, { repo, commit, chunks }) {
  const points = chunks.map(([path, language, startLine, text], i) => ({
    t: 'point',
    id: i + 1,
    vector: embedText(text, DIM),
    payload: {
      chunk_hash: createHash('sha256').update(text).digest('hex').slice(0, 16),
      commit_sha: commit,
      end_line: startLine + text.split('\n').length - 1,
      language,
      path,
      repo,
      start_line: startLine,
      text,
    },
  }));
  const header = {
    t: 'header',
    format: 'lattice-jsonl',
    version: 1,
    config: {
      name: id,
      vectors: { size: DIM, distance: 'Cosine' },
      hnsw: { m: 16, m0: 32, ml: 0.36067376022224085, ef: 50, ef_construction: 200 },
      relations: {},
      durability: 'ephemeral',
    },
    vectors: 'inline',
    dim: DIM,
    points: points.length,
    edges: 0,
  };
  const jsonl = Buffer.from([header, ...points].map(jsonLine).join('\n') + '\n', 'utf8');
  // gzip with a fixed level; node's gzip writes mtime=0, so the bytes are stable.
  const gz = gzipSync(jsonl, { level: 9 });
  const meta = {
    bytes: jsonl.byteLength,
    commit_sha: commit,
    dim: DIM,
    files: new Set(chunks.map(([p]) => p)).size,
    generated_at: GENERATED_AT,
    gz_bytes: gz.byteLength,
    model: MODEL,
    points: points.length,
    repo,
    sha256: createHash('sha256').update(jsonl).digest('hex'),
  };
  writeFileSync(join(OUT_DIR, `${id}.jsonl`), jsonl);
  writeFileSync(join(OUT_DIR, `${id}.jsonl.gz`), gz);
  writeFileSync(join(OUT_DIR, `${id}.meta.json`), JSON.stringify(sortKeys(meta), null, 2) + '\n');
  console.log(`${id}: ${points.length} points, ${meta.files} files, ${meta.bytes} bytes (${meta.gz_bytes} gz), commit ${commit.slice(0, 7)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [id, spec] of Object.entries(CORPORA)) build(id, spec);
}
