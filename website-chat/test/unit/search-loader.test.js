// SPDX-License-Identifier: Apache-2.0
// The search-mode loader (src/state/search-loader.js) over its ports: the
// real corpus transport with only `fetch` stubbed, the real WebCrypto
// SHA-256, an in-memory OPFS cache, and a recording engine. The engine is a
// stub so these tests can count installs and embedder registrations and run
// without the wasm; test/unit/lattice-search.test.js runs the real v0.5.0
// engine, and e2e/search.spec.js drives the whole path in a browser.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { sha256Hex } from '../../src/adapters/browser.js';
import { createCorpusNet } from '../../src/adapters/corpus.js';
import { createSearchLoader } from '../../src/state/search-loader.js';
import { SHA, rawMeta } from './search-fixture.js';

const snapshotOf = (seed, size) => Uint8Array.from({ length: size }, (_, i) => (i * 31 + seed) % 251);

function corpusFixture(id, seed, over = {}) {
  const bytes = snapshotOf(seed, 3000 + seed);
  const meta = rawMeta({ snapshot_bytes: bytes.byteLength, snapshot_sha256: createHash('sha256').update(bytes).digest('hex'), ...over });
  return { id, bytes, meta, snapshotUrl: `https://c.test/${id}.lattice`, metaUrl: `https://c.test/${id}.meta.json` };
}
const SITE = corpusFixture('site', 1);
const BLOG = corpusFixture('blog', 2, { search_mode: 'hybrid', model: 'test/embed-8', dim: 8 });
const EMBEDDER = { model: 'test/embed-8', dim: 8, embed: async (t) => t.map(() => new Array(8).fill(0)) };

function rig({ corpora, cached = {}, embedder = null, served = {} }) {
  const fetched = [];
  const statuses = [];
  const net = createCorpusNet({
    fetch: async (url) => {
      fetched.push(url);
      const c = corpora.find((x) => url === x.metaUrl || url === x.snapshotUrl);
      if (url === c.metaUrl) return new Response(JSON.stringify(c.meta));
      return new Response(served[c.id] ?? c.bytes);
    },
  });
  const committed = [];
  const faults = [];
  const cache = {
    getCachedCorpus: async (id, sha, size) => (cached[id] && sha === SHA && cached[id].byteLength === size ? new Blob([cached[id]]) : null),
    createCorpusWriter: async (id) => {
      const parts = [];
      return { write: async (b) => parts.push(b), finalize: async () => committed.push([id, parts.reduce((n, b) => n + b.byteLength, 0)]), discard: async () => undefined };
    },
    writeMeta: async () => undefined,
    newestOffline: async () => null,
    pruneStale: async () => undefined,
  };
  const engine = { installs: [], embedders: [], inits: 0 };
  const search = {
    init: async () => {
      engine.inits++;
    },
    install: (name, bytes) => engine.installs.push([name, bytes.byteLength]),
    setEmbedder: (model, dim) => engine.embedders.push([model, dim]),
  };
  const chatTarget = { status: 'idle', progress: { loadedBytes: 0, totalBytes: 0, indexed: 0, totalPoints: 0 }, corpora: [], offline: false, error: null, consent: null };
  const chat = new Proxy(chatTarget, {
    set(t, k, v) {
      if (k === 'status' && statuses.at(-1) !== v) statuses.push(v);
      t[k] = v;
      return true;
    },
  });
  const loader = createSearchLoader({
    chat,
    corpora: corpora.map(({ id, snapshotUrl, metaUrl }) => ({ id, snapshotUrl, metaUrl })),
    embedder,
    ports: { search, cache, net, wasmBytes: async () => 900_000, sha256: sha256Hex, reportCacheFault: (e) => faults.push(e) },
  });
  return { loader, chat, fetched, statuses, engine, committed, faults };
}

const until = async (pred) => {
  for (let i = 0; i < 200 && !pred(); i++) await new Promise((r) => setTimeout(r, 5));
  assert.ok(pred(), 'condition never held');
};

async function openAndAccept(r) {
  const done = r.loader.ensureReady();
  await until(() => r.chat.status === 'consent' || r.chat.status === 'error' || r.chat.status === 'ready');
  if (r.chat.status === 'consent') r.loader.accept();
  await done;
}

describe('search loader', () => {
  it('a first open reads the manifests, asks with the snapshot sizes, then downloads, verifies, installs and caches', async () => {
    const r = rig({ corpora: [SITE, BLOG], embedder: EMBEDDER });
    const done = r.loader.ensureReady();
    await until(() => r.chat.status === 'consent');
    assert.deepEqual(r.fetched, [SITE.metaUrl, BLOG.metaUrl]);
    assert.equal(r.engine.inits, 0);
    assert.deepEqual(r.chat.consent.corpora, [
      { id: 'site', bytes: SITE.bytes.byteLength },
      { id: 'blog', bytes: BLOG.bytes.byteLength },
    ]);
    assert.equal(r.chat.consent.totalBytes, SITE.bytes.byteLength + BLOG.bytes.byteLength + 900_000);
    r.loader.accept();
    await done;

    assert.equal(r.chat.status, 'ready', JSON.stringify(r.chat.error));
    assert.deepEqual(r.engine.installs, [['site', SITE.bytes.byteLength], ['blog', BLOG.bytes.byteLength]]);
    assert.deepEqual(r.engine.embedders, [['test/embed-8', 8]]);
    assert.deepEqual(r.committed, [['site', SITE.bytes.byteLength], ['blog', BLOG.bytes.byteLength]]);
    assert.deepEqual(r.chat.corpora.map((c) => [c.id, c.plan.kind, c.chunks]), [['site', 'bm25', 12], ['blog', 'hybrid', 12]]);
    assert.equal(r.chat.progress.loadedBytes, r.chat.progress.totalBytes);
    assert.deepEqual(r.statuses, ['manifest', 'consent', 'wasm-init', 'downloading', 'indexing', 'downloading', 'indexing', 'ready']);
  });

  it('a cached open never asks, installs from the cache, and fetches only the manifest', async () => {
    const r = rig({ corpora: [SITE], cached: { site: SITE.bytes } });
    await r.loader.ensureReady();
    assert.equal(r.chat.status, 'ready');
    assert.deepEqual(r.fetched, [SITE.metaUrl]);
    assert.deepEqual(r.engine.installs, [['site', SITE.bytes.byteLength]]);
    assert.deepEqual(r.engine.embedders, [], 'no embedder needed for a lexical corpus');
    assert.ok(!r.statuses.includes('consent'));
  });

  it('a download that fails its checksum is never installed nor cached', async () => {
    const tampered = SITE.bytes.slice();
    tampered[10] ^= 1;
    const r = rig({ corpora: [SITE], served: { site: tampered } });
    await openAndAccept(r);
    assert.equal(r.chat.status, 'error');
    assert.equal(r.chat.error.kind, 'corpus');
    assert.match(r.chat.error.message, /does not match its manifest's snapshot_sha256/);
    assert.deepEqual(r.engine.installs, []);
    assert.deepEqual(r.committed, []);
  });

  it('a cached snapshot that fails its checksum is a miss: reported, asked for and downloaded again', async () => {
    const corrupt = SITE.bytes.slice();
    corrupt[0] ^= 1;
    const r = rig({ corpora: [SITE], cached: { site: corrupt } });
    await openAndAccept(r);
    assert.equal(r.chat.status, 'ready');
    assert.ok(r.statuses.includes('consent'));
    assert.deepEqual(r.fetched, [SITE.metaUrl, SITE.snapshotUrl]);
    assert.match(String(r.faults[0]?.message), /failed its checksum/);
  });

  it('a corpus published without a snapshot fails as config, before asking or downloading', async () => {
    const bare = corpusFixture('site', 1, { snapshot_bytes: null, snapshot_sha256: null, snapshot_format: null });
    const r = rig({ corpora: [bare] });
    await r.loader.ensureReady();
    assert.equal(r.chat.error.kind, 'config');
    assert.match(r.chat.error.message, /without a snapshot/);
    assert.deepEqual(r.fetched, [bare.metaUrl]);
  });

  it('a vector corpus without search.embedder fails as config', async () => {
    const vector = corpusFixture('site', 1, { search_mode: 'vector', model: 'test/embed-8', dim: 8, text_field: null });
    const r = rig({ corpora: [vector] });
    await r.loader.ensureReady();
    assert.equal(r.chat.error.kind, 'config');
    assert.match(r.chat.error.message, /set search\.embedder/);
  });

  it('declining leaves idle with only the manifests fetched', async () => {
    const r = rig({ corpora: [SITE] });
    const done = r.loader.ensureReady();
    await until(() => r.chat.status === 'consent');
    r.loader.abortLoad();
    await done;
    assert.equal(r.chat.status, 'idle');
    assert.deepEqual(r.fetched, [SITE.metaUrl]);
    assert.equal(r.engine.inits, 0);
  });
});
