// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// lattice-search.js — search mode's use of the LatticeDB wasm: install a
// corpus snapshot, register the site's embedder, and query through the
// engine's own REST router (`route`), the same Qdrant-style API the native
// server and the edge hosts answer. Needs lattice-db >= v0.5.0, whose wasm
// adds importSnapshot / route / setEmbedder; an older build is refused at
// init with that requirement named. Binding quirks (thrown JSON strings,
// ApiResponse envelopes, byte bodies) are normalized here and nowhere else.
// =============================================================================

import { parseQueryResponse } from '../core/search.js';

const REQUIRED = ['importSnapshot', 'route', 'setEmbedder'];

/** A wasm call that throws a JSON `{message}` string (or anything) as an Error. */
function wasmError(what, thrown) {
  let message = thrown instanceof Error ? thrown.message : String(thrown);
  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed.message === 'string') message = parsed.message;
  } catch {
    // not JSON: keep the text as it is
  }
  return new Error(`${what} failed: ${message}`);
}

/**
 * @param {{init: () => Promise<object>}} lattice  adapters/lattice.js, bound to config.wasm
 */
export function createLatticeSearch(lattice) {
  let db = null;

  function requireDb() {
    if (!db) throw new Error('LatticeDB wasm not initialized — call init() first');
    return db;
  }

  /** Load the wasm (idempotent) and check it can serve search mode. */
  async function init() {
    const handle = await lattice.init();
    const missing = REQUIRED.filter((fn) => typeof handle[fn] !== 'function');
    if (missing.length > 0) {
      throw new Error(`this LatticeDB build has no ${missing.join('/')}; search mode needs lattice-db >= v0.5.0 (config.wasm)`);
    }
    db = handle;
  }

  /**
   * Install snapshot `bytes` as collection `name`. 'replace' so a retried
   * load reinstalls a corpus the failed attempt already installed.
   * @returns {{points_imported: number}}
   */
  function install(name, bytes) {
    let res;
    try {
      res = requireDb().importSnapshot(bytes, name, 'replace');
    } catch (err) {
      throw wasmError('snapshot install', err);
    }
    if (!res || res.status !== 'ok' || !res.result) throw wasmError('snapshot install', res?.error ?? 'unknown wasm error');
    return res.result;
  }

  /** Register the embedder text queries naming `model` are embedded with. */
  function setEmbedder(model, dim, embed) {
    try {
      requireDb().setEmbedder(model, dim, embed);
    } catch (err) {
      throw wasmError('setEmbedder', err);
    }
  }

  /**
   * POST /collections/{name}/points/query with `body`.
   * @returns {Promise<import('../core/search.js').Hit[]>}
   */
  async function query(name, body) {
    let res;
    try {
      res = await requireDb().route('POST', `/collections/${encodeURIComponent(name)}/points/query`, JSON.stringify(body));
    } catch (err) {
      throw wasmError('search', err);
    }
    return parseQueryResponse(res.status, new TextDecoder().decode(res.body));
  }

  return { init, install, setEmbedder, query };
}
