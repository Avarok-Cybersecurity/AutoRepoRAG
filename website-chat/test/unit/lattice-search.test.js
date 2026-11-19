// SPDX-License-Identifier: Apache-2.0
// The search-mode wasm adapter (src/adapters/lattice-search.js).
//
// The stubbed LatticeDB covers the binding quirks the real engine will not
// produce on demand (a pre-v0.5.0 build, a thrown JSON string). The last
// suite runs the adapter against the real v0.5.0 engine, from the bundle the
// browser suite vendors (e2e/.site/repo-chat-search, written by
// scripts/emit-website-chat.mjs v0.5.0); it is skipped until that is emitted.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createLattice } from '../../src/adapters/lattice.js';
import { createLatticeSearch } from '../../src/adapters/lattice-search.js';

const enc = (obj) => new TextEncoder().encode(JSON.stringify(obj));

function stubDb(over = {}) {
  const calls = [];
  return {
    calls,
    importSnapshot: (bytes, name, mode) => (calls.push(['importSnapshot', name, mode]), { status: 'ok', result: { points_imported: 3 } }),
    setEmbedder: (model, dim) => calls.push(['setEmbedder', model, dim]),
    route: async (method, path, body) => (calls.push(['route', method, path, JSON.parse(body)]), { status: 200, headers: {}, body: enc({ status: 'ok', result: { points: [{ id: 1, score: 2, payload: { text: 't' } }] } }) }),
    ...over,
  };
}
const searchOver = (db) => createLatticeSearch({ init: async () => db });

describe('createLatticeSearch', () => {
  it('refuses a wasm older than v0.5.0, naming what is missing', async () => {
    await assert.rejects(searchOver({ search() {} }).init(), /no importSnapshot\/route\/setEmbedder; search mode needs lattice-db >= v0.5.0/);
  });

  it('installs with replace and queries through the router', async () => {
    const db = stubDb();
    const s = searchOver(db);
    await s.init();
    assert.deepEqual(s.install('site', new Uint8Array(4)), { points_imported: 3 });
    const hits = await s.query('my site', { query: { text: 'x', model: 'bm25' }, limit: 2, with_payload: true });
    assert.deepEqual(hits, [{ id: 1, score: 2, payload: { text: 't' } }]);
    assert.deepEqual(db.calls, [
      ['importSnapshot', 'site', 'replace'],
      ['route', 'POST', '/collections/my%20site/points/query', { query: { text: 'x', model: 'bm25' }, limit: 2, with_payload: true }],
    ]);
  });

  it('a thrown JSON error string becomes its message', async () => {
    const s = searchOver(
      stubDb({
        importSnapshot: () => {
          throw '{"message":"Invalid import data: too small","status":"error"}';
        },
      })
    );
    await s.init();
    assert.throws(() => s.install('site', new Uint8Array(1)), /^Error: snapshot install failed: Invalid import data: too small$/);
  });

  it('nothing runs before init', () => {
    assert.throws(() => searchOver(stubDb()).install('x', new Uint8Array(1)), /not initialized/);
  });
});

const WASM_DIR = fileURLToPath(new URL('../../e2e/.site/repo-chat-search/', import.meta.url));
const EMITTED = existsSync(join(WASM_DIR, 'lattice_server_bg.wasm'));

describe('createLatticeSearch against the real v0.5.0 wasm', { skip: EMITTED ? false : 'emit e2e/.site/repo-chat-search first (README, Developing)' }, () => {
  it('installs an exported snapshot and answers BM25 and hybrid queries', async () => {
    const jsUrl = pathToFileURL(join(WASM_DIR, 'lattice_server.js')).href;
    const binPath = join(WASM_DIR, 'lattice_server_bg.wasm');
    const lattice = createLattice(
      { jsUrl, binUrl: binPath },
      { importModule: (u) => import(u), fetch: async () => new Response(readFileSync(binPath), { headers: { 'content-type': 'application/wasm' } }) }
    );
    const db = await lattice.init();
    // Build a tiny hybrid collection in the same engine, export it, and reinstall it under another name.
    await db.route('PUT', '/collections/src', JSON.stringify({ vectors: { size: 2, distance: 'Cosine', index: 'flat' }, text_index: { field: 'text' }, embedding: { model: 'm2' } }));
    await db.route('PUT', '/collections/src/points', JSON.stringify({ points: [{ id: 1, vector: [1, 0], payload: { text: 'contact the team' } }, { id: 2, vector: [0, 1], payload: { text: 'pricing and plans' } }] }));
    const snapshot = db.exportSnapshot('src');

    const s = createLatticeSearch(lattice);
    await s.init();
    assert.equal(s.install('site', snapshot).points_imported, 2);
    assert.equal(s.install('site', snapshot).points_imported, 2, 'a retried load reinstalls');
    assert.deepEqual((await s.query('site', { query: { text: 'pricing', model: 'bm25' }, limit: 5, with_payload: true })).map((h) => h.id), [2]);

    s.setEmbedder('m2', 2, async (texts) => texts.map(() => [1, 0]));
    const fused = await s.query('site', { prefetch: [{ query: { text: 'pricing', model: 'bm25' }, limit: 5 }, { query: { text: 'pricing', model: 'm2' }, limit: 5 }], query: { fusion: 'rrf' }, limit: 5, with_payload: true });
    assert.deepEqual(new Set(fused.map((h) => h.id)), new Set([1, 2]));
    await assert.rejects(s.query('nope', { query: { text: 'x', model: 'bm25' }, limit: 1 }), /HTTP 404/);
  });
});
