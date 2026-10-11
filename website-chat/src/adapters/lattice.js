// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// lattice.js — thin wrapper around the LatticeDB wasm build. The loader
// (lattice_server.js) is loaded at runtime from config.wasm.jsUrl via a
// dynamic import, so none of the ~760 KB wasm lands in the library bundle.
// All wasm-binding quirks (ApiResponse envelopes, the listCollections shape)
// are normalized here and nowhere else. One collection per corpus.
// =============================================================================

// The raw wasm binding returns { status, result, error } envelopes.
function unwrap(res, what) {
  if (res && res.status === 'ok' && res.result !== undefined) return res.result;
  throw new Error(`${what} failed: ${(res && res.error) || 'unknown wasm error'}`);
}

/**
 * @param {{jsUrl: string, binUrl: string}} wasm  config.wasm
 * @param {{importModule: (url: string) => Promise<any>, fetch: typeof fetch}} io
 */
export function createLattice(wasm, io) {
  let db = null;
  let initPromise = null;

  /**
   * Initialize the wasm module and this session's LatticeDB instance.
   * Idempotent; safe to re-call after a failure (the promise is dropped so a
   * retry re-runs the load).
   */
  function init() {
    if (db) return Promise.resolve(db);
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const mod = await io.importModule(wasm.jsUrl);
      try {
        await mod.default({ module_or_path: wasm.binUrl });
      } catch {
        // Origins that serve .wasm with a wrong MIME type break
        // instantiateStreaming — fall back to fetch + ArrayBuffer instantiate.
        const res = await io.fetch(wasm.binUrl);
        if (!res.ok) throw new Error(`wasm fetch failed: HTTP ${res.status}`);
        await mod.default({ module_or_path: await res.arrayBuffer() });
      }
      db = new mod.LatticeDB();
      return db;
    })();
    initPromise.catch(() => {
      initPromise = null;
    });
    return initPromise;
  }

  function requireDb() {
    if (!db) throw new Error('LatticeDB wasm not initialized — call init() first');
    return db;
  }

  // The binding returns collection info as `{ collections: [{ name }] }` at
  // runtime even though its .d.ts claims `string[]` — normalize both shapes.
  function collectionNames() {
    const raw = unwrap(requireDb().listCollections(), 'listCollections');
    if (Array.isArray(raw)) return raw.map((c) => (typeof c === 'string' ? c : c?.name));
    return (raw?.collections ?? []).map((c) => c.name);
  }

  /**
   * (Re)create `name` for `dim`-sized cosine vectors. Any existing collection
   * is dropped first so a retried load never indexes on top of a partial one.
   */
  function createCollection(name, dim) {
    const handle = requireDb();
    if (collectionNames().includes(name)) {
      handle.deleteCollection(name);
    }
    const res = handle.createCollection(name, {
      vectors: { size: dim, distance: 'Cosine' },
    });
    if (!res || res.status !== 'ok' || res.result !== true) {
      throw new Error(`createCollection failed: ${(res && res.error) || 'unknown wasm error'}`);
    }
  }

  /** Upsert a batch of `{ id, vector, payload }` points into `name`. */
  function upsert(name, points) {
    return unwrap(requireDb().upsert(name, points), 'upsert');
  }

  /**
   * Nearest-neighbor search. Returned `score` is a cosine DISTANCE
   * (0.0 = identical, lower = better).
   */
  function search(name, vector, limit) {
    const res = requireDb().search(name, new Float32Array(vector), limit, {
      with_payload: true,
    });
    return unwrap(res, 'search');
  }

  return { init, createCollection, upsert, search };
}
