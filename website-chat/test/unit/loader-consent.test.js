// SPDX-License-Identifier: Apache-2.0
// The download consent step in the corpus loader (src/state/loader.js): a
// first open fetches only the small meta.json files, then waits in 'consent'
// with the size of what is missing; nothing large (no .jsonl.gz, no wasm init)
// starts until accept(). Cached corpora skip the step; a partial cache asks
// only for the rest. The stubs are the loader's ports: the transport's fetch
// (behind the real corpus adapter), an in-memory OPFS cache, a recording
// LatticeDB, and the wasm size probe.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createCorpusNet } from '../../src/adapters/corpus.js';
import { createLoader } from '../../src/state/loader.js';
import { ROOT } from './walk.js';

const FIX = join(ROOT, 'e2e', 'fixtures');
const corpusFixture = (id) => ({
  id,
  metaUrl: `https://c.test/${id}.meta.json`,
  gzUrl: `https://c.test/${id}.jsonl.gz`,
  meta: JSON.parse(readFileSync(join(FIX, `${id}.meta.json`), 'utf8')),
  gz: readFileSync(join(FIX, `${id}.jsonl.gz`)),
  jsonl: readFileSync(join(FIX, `${id}.jsonl`)),
});
const CODE = corpusFixture('code');
const DOCS = corpusFixture('docs');
const WASM_BYTES = 760_000;

function rig({ corpora, cached = [], wasmBytes = WASM_BYTES, failFirstGz = false }) {
  const fetched = [];
  const statuses = [];
  const byUrl = new Map(corpora.flatMap((c) => [[c.metaUrl, () => new Response(JSON.stringify(c.meta))], [c.gzUrl, () => new Response(c.gz)]]));
  const net = createCorpusNet({
    fetch: async (url) => {
      fetched.push(url);
      if (failFirstGz && url.endsWith('.gz')) {
        failFirstGz = false;
        return new Response('busy', { status: 503 });
      }
      return byUrl.get(url)();
    },
  });
  const cachedSet = new Map(cached.map((c) => [c.id, c]));
  const cache = {
    getCachedCorpus: async (id, sha) => {
      const c = cachedSet.get(id);
      return c && c.meta.commit_sha === sha ? { size: c.jsonl.length, stream: () => new Response(c.jsonl).body } : null;
    },
    createCorpusWriter: async () => null,
    writeMeta: async () => undefined,
    newestOffline: async () => null,
    pruneStale: async () => undefined,
  };
  let inits = 0;
  const lattice = {
    init: async () => {
      inits++;
    },
    createCollection: () => undefined,
    upsert: () => undefined,
  };
  let probes = 0;
  const chatTarget = { status: 'idle', progress: { loadedBytes: 0, totalBytes: 0, indexed: 0, totalPoints: 0 }, corpora: [], embedding: null, offline: false, error: null, consent: null };
  const chat = new Proxy(chatTarget, {
    set(t, k, v) {
      if (k === 'status' && statuses.at(-1) !== v) statuses.push(v);
      t[k] = v;
      return true;
    },
  });
  const loader = createLoader({
    chat,
    corpora: corpora.map(({ id, gzUrl, metaUrl }) => ({ id, gzUrl, metaUrl })),
    upsertBatch: 256,
    ports: {
      lattice,
      cache,
      net,
      idleYield: async () => undefined,
      wasmBytes: async () => {
        probes++;
        return wasmBytes;
      },
    },
  });
  return { loader, chat, fetched, statuses, inits: () => inits, probes: () => probes };
}

const until = async (pred) => {
  for (let i = 0; i < 200 && !pred(); i++) await new Promise((r) => setTimeout(r, 5));
  assert.ok(pred(), 'condition never held');
};

describe('download consent', () => {
  it('a first open fetches only the manifests, then waits with the size of what is missing', async () => {
    const r = rig({ corpora: [CODE, DOCS] });
    const done = r.loader.ensureReady();
    await until(() => r.chat.status === 'consent');
    await new Promise((res) => setTimeout(res, 30));

    assert.deepEqual(r.fetched, [CODE.metaUrl, DOCS.metaUrl]);
    assert.equal(r.inits(), 0, 'the wasm engine waits for consent too');
    assert.deepEqual(r.chat.consent, {
      corpora: [
        { id: 'code', bytes: CODE.meta.gz_bytes },
        { id: 'docs', bytes: DOCS.meta.gz_bytes },
      ],
      wasmBytes: WASM_BYTES,
      totalBytes: CODE.meta.gz_bytes + DOCS.meta.gz_bytes + WASM_BYTES,
    });

    r.loader.accept();
    await done;
    assert.equal(r.chat.status, 'ready');
    assert.equal(r.chat.consent, null);
    assert.deepEqual(r.fetched.slice(2).sort(), [CODE.gzUrl, DOCS.gzUrl].sort());
  });

  it('a fully cached set never asks and fetches no corpus', async () => {
    const r = rig({ corpora: [CODE, DOCS], cached: [CODE, DOCS] });
    await r.loader.ensureReady();
    assert.equal(r.chat.status, 'ready');
    assert.ok(!r.statuses.includes('consent'), r.statuses.join(' > '));
    assert.deepEqual(r.fetched, [CODE.metaUrl, DOCS.metaUrl]);
    assert.equal(r.probes(), 0, 'no wasm size probe when nothing is asked');
  });

  it('a partially cached set asks only for the rest', async () => {
    const r = rig({ corpora: [CODE, DOCS], cached: [CODE] });
    const done = r.loader.ensureReady();
    await until(() => r.chat.status === 'consent');
    assert.deepEqual(r.chat.consent.corpora, [{ id: 'docs', bytes: DOCS.meta.gz_bytes }]);
    r.loader.accept();
    await done;
    assert.deepEqual(r.fetched.filter((u) => u.endsWith('.gz')), [DOCS.gzUrl]);
  });

  it('a cached or unknown-size engine adds nothing to the total', async () => {
    for (const wasmBytes of [0, null]) {
      const r = rig({ corpora: [CODE], wasmBytes });
      const done = r.loader.ensureReady();
      await until(() => r.chat.status === 'consent');
      assert.equal(r.chat.consent.totalBytes, CODE.meta.gz_bytes);
      assert.equal(r.chat.consent.wasmBytes, wasmBytes);
      r.loader.abortLoad();
      await done;
    }
  });

  it('declining (abort) leaves idle with nothing large fetched, and the next open asks again', async () => {
    const r = rig({ corpora: [CODE] });
    const first = r.loader.ensureReady();
    await until(() => r.chat.status === 'consent');
    r.loader.abortLoad();
    await first;
    assert.equal(r.chat.status, 'idle');
    assert.equal(r.chat.consent, null);
    assert.deepEqual(r.fetched, [CODE.metaUrl]);
    assert.equal(r.inits(), 0);

    const second = r.loader.ensureReady();
    await until(() => r.chat.status === 'consent');
    r.loader.accept();
    await second;
    assert.equal(r.chat.status, 'ready');
  });

  it('a retry after a failed download does not ask twice', async () => {
    const r = rig({ corpora: [CODE], failFirstGz: true });
    const first = r.loader.ensureReady();
    await until(() => r.chat.status === 'consent');
    r.loader.accept();
    await first;
    assert.equal(r.chat.status, 'error');

    await r.loader.ensureReady();
    assert.equal(r.chat.status, 'ready');
    assert.equal(r.statuses.filter((s) => s === 'consent').length, 1, r.statuses.join(' > '));
  });
});
