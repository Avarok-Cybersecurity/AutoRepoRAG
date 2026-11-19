// site.test.mjs — the whole action in v3 site mode, end to end.
//
// Runs the action's entrypoint (src/main.mjs) on fixtures/site: files-dir
// over a dist/ that is gitignored in its workspace (what GeoHarness hands
// over), markdown chunking, lexical search, the payload sidecar, an edges
// file, and a snapshot, with the lattice-server v0.5.0 release the action
// downloads and sha256-verifies itself (linux or macOS). Then loads that
// snapshot into the v0.5.0 wasm build (fetched and verified by the action's
// own website-chat downloader), as a visitor's browser or a Worker would,
// and checks that a BM25 query ranks the right page first. Also: a
// hybrid/int8 mock run, and the max-snapshot-bytes guard naming both sizes.
// Needs network access to the GitHub release. Run:
//   node --test test/integration/site.test.mjs

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { sha256Hex } from '../../src/util.mjs';
import { fetchLatticeWasm } from '../../src/website-chat.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const LATTICE_VERSION = 'v0.5.0';
const SHA = 'c0ffee'.padEnd(40, '0');

let ws;
let port = 6600 + (process.pid % 200);

/** Run the action with v3 site inputs (+ overrides); returns {status, out, meta, files}. */
function runSite(name, overrides = {}) {
  const outDir = join(ws, `out-${name}`);
  const inputs = {
    PATHS: '**/*.md', EXCLUDE: '', SOURCE_DIR: '', COLLECTION: 'site', OUTPUT_DIR: outDir, OUTPUT_NAME: 'site',
    GZIP: 'true', EMBEDDING_ENDPOINT: '', EMBEDDING_MODEL: '', EMBEDDING_API_KEY: '', MOCK_EMBEDDINGS: 'false',
    MOCK_DIM: '64', CHUNK_LINES: '', CHUNK_OVERLAP: '', MAX_CHUNK_BYTES: '2000', BATCH_SIZE: '32',
    REQUEST_INTERVAL_MS: '', MAX_RETRIES: '3', MAX_CHUNKS: '0', VECTOR_PRECISION: '', PREVIOUS_CORPUS_URL: '',
    PREVIOUS_CORPUS_META_URL: '', LATTICE_VERSION, LATTICE_PORT: String(port++), GENERATE_WEBSITE_CHAT: 'false',
    WEBSITE_CHAT_DIR: '', FILES_DIR: 'dist', CORPUS_REPO: 'acme/site', CORPUS_COMMIT: SHA, CHUNK_STRATEGY: 'markdown',
    PAYLOAD_SIDECAR: 'sidecar.json', EDGES_FILE: 'edges.json', SEARCH_MODE: 'lexical', VECTOR_INDEX: '',
    VECTOR_STORAGE: '', SNAPSHOT: 'true', MAX_SNAPSHOT_BYTES: String(25 * 1024 * 1024), ...overrides,
  };
  // One RUNNER_TEMP for every run: the verified release download is cached there.
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, GITHUB_WORKSPACE: ws, RUNNER_TEMP: join(ws, 'tmp') };
  for (const [k, v] of Object.entries(inputs)) env[`INPUT_${k}`] = v;
  const started = Date.now();
  const r = spawnSync(process.execPath, [join(ROOT, 'src/main.mjs')], { env, encoding: 'utf8' });
  const out = `${r.stdout}${r.stderr}`;
  const metaPath = join(outDir, 'site.meta.json');
  const meta = r.status === 0 ? JSON.parse(readFileSync(metaPath, 'utf8')) : null;
  return { status: r.status, out, meta, outDir, ms: Date.now() - started };
}

async function wasmDb() {
  const dir = await fetchLatticeWasm(LATTICE_VERSION, join(ws, 'tmp', 'wasm-cache'));
  const mod = await import(pathToFileURL(join(dir, 'lattice_server.js')).href);
  await mod.default({ module_or_path: readFileSync(join(dir, 'lattice_server_bg.wasm')) });
  return new mod.LatticeDB({ readOnly: true });
}

async function bm25(db, collection, text, limit = 3) {
  const res = await db.route('POST', `/collections/${collection}/points/query`,
    JSON.stringify({ query: { text, model: 'bm25' }, limit, with_payload: true }));
  assert.equal(res.status, 200, Buffer.from(res.body).toString());
  return JSON.parse(Buffer.from(res.body).toString()).result.points;
}

before(() => {
  ws = mkdtempSync(join(tmpdir(), 'autoreporag-site-'));
  cpSync(join(ROOT, 'fixtures/site'), ws, { recursive: true });
  // dist/ is gitignored, as a site build's output is: git would list nothing.
  writeFileSync(join(ws, '.gitignore'), 'dist/\ntmp/\nout-*/\n');
  execFileSync('git', ['init', '-q', ws]);
  assert.equal(execFileSync('git', ['-C', ws, 'ls-files', '--others', '--exclude-standard', 'dist']).toString(), '');
});

describe('v3 site corpus: files-dir + markdown + lexical + snapshot', () => {
  let run;
  before(() => {
    run = runSite('lexical');
    assert.equal(run.status, 0, run.out);
  });

  it('writes jsonl, gz, snapshot and a v3 meta.json', () => {
    const { meta, outDir } = run;
    assert.equal(meta.search_mode, 'lexical');
    assert.equal(meta.chunk_strategy, 'markdown');
    assert.equal(meta.text_field, 'text');
    assert.equal(meta.dim, 0);
    assert.equal(meta.model, null);
    assert.equal(meta.embedded, 0);
    assert.equal(meta.files, 7);
    assert.equal(meta.repo, 'acme/site');
    assert.equal(meta.commit_sha, SHA);
    assert.equal(meta.snapshot_format, 2);
    const snap = readFileSync(join(outDir, 'site.lattice'));
    assert.equal(meta.snapshot_bytes, snap.length);
    assert.equal(meta.snapshot_sha256, sha256Hex(snap));
    console.log(`  fixture: ${meta.points} chunks, ${meta.edges} edges, jsonl ${meta.bytes} B, gz ${meta.gz_bytes} B, snapshot ${snap.length} B, action ${run.ms} ms`);
  });

  it('every chunk carries heading_path and the sidecar fields; edges are next + edges-file', () => {
    const lines = readFileSync(join(run.outDir, 'site.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const [header, ...rest] = lines;
    assert.deepEqual(Object.keys(header.config).sort(), ['durability', 'hnsw', 'name', 'relations', 'text_index']);
    const points = rest.filter((l) => l.t === 'point');
    const edges = rest.filter((l) => l.t === 'edge');
    for (const p of points) {
      assert.ok(Array.isArray(p.payload.heading_path));
      assert.match(p.payload.url, /^https:\/\/acme\.example\//);
      assert.deepEqual(p.vector, []);
    }
    const limits = points.find((p) => p.payload.heading_path.join('/') === 'Pricing/Free plan limits');
    assert.equal(limits.payload.title, 'Pricing');
    const files = new Set(points.map((p) => p.payload.path));
    const nextCount = points.length - files.size;
    assert.equal(edges.length, nextCount + 3);
    assert.equal(header.edges, edges.length);
    assert.deepEqual(header.config.relations, { next: 0, links_to: 1 });
  });

  it('the snapshot loads in the wasm build and BM25 ranks the right page first', async () => {
    const db = await wasmDb();
    const started = performance.now();
    const res = db.importSnapshot(readFileSync(join(run.outDir, 'site.lattice')), 'site', 'create');
    const loadMs = performance.now() - started;
    assert.equal(res.status, 'ok', JSON.stringify(res));
    for (const [q, url, heading] of [
      ['free plan request limit', 'https://acme.example/pricing/', 'Pricing/Free plan limits'],
      ['install the CLI with npm', 'https://acme.example/docs/install/', 'Installation/Install the package'],
      ['WidgetGoneError', 'https://acme.example/docs/api/', 'API reference/destroy(widget)/Errors'],
    ]) {
      const hits = await bm25(db, 'site', q);
      assert.equal(hits[0].payload.url, url, `${q}: ${JSON.stringify(hits.map((h) => h.payload.url))}`);
      assert.equal(hits[0].payload.heading_path.join('/'), heading);
    }
    console.log(`  wasm importSnapshot ${loadMs.toFixed(2)} ms`);
  });

  it('is deterministic: a second run writes a byte-identical jsonl', () => {
    const again = runSite('lexical-again');
    assert.equal(again.status, 0, again.out);
    assert.equal(again.meta.sha256, run.meta.sha256);
  });
});

describe('v3 site corpus: hybrid with mock vectors, flat int8', () => {
  it('builds, records the embedding model and keeps the stored (int8) vectors', () => {
    const r = runSite('hybrid', {
      SEARCH_MODE: 'hybrid', VECTOR_INDEX: 'flat', VECTOR_STORAGE: 'int8', MOCK_EMBEDDINGS: 'true',
      EMBEDDING_ENDPOINT: 'https://api.cloudflare.com/client/v4/accounts/x/ai/v1', VECTOR_PRECISION: '6', REQUEST_INTERVAL_MS: '0',
    });
    assert.equal(r.status, 0, r.out);
    assert.equal(r.meta.dim, 64);
    assert.equal(r.meta.model, 'mock');
    assert.equal(r.meta.vector_storage, 'int8');
    const header = JSON.parse(readFileSync(join(r.outDir, 'site.jsonl'), 'utf8').split('\n')[0]);
    assert.deepEqual(header.config.embedding, { model: 'mock' });
    assert.deepEqual(header.config.vectors, { distance: 'cosine', index: 'flat', size: 64, storage: 'int8' });
  });
});

describe('v3 site corpus: max-snapshot-bytes', () => {
  it('fails naming both sizes and writes no snapshot', () => {
    const r = runSite('too-big', { MAX_SNAPSHOT_BYTES: '1024' });
    assert.notEqual(r.status, 0);
    assert.match(r.out, /::error::AutoRepoRAG failed: snapshot is \d+ bytes \([\d.]+ MiB\), over max-snapshot-bytes 1024 \(0\.00 MiB\)/);
    assert.equal(existsSync(join(r.outDir, 'site.lattice')), false);
  });
});
