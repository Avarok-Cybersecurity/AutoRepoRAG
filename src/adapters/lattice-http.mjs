// lattice-http.mjs — the LatticeClient port's HTTP adapter: a minimal REST client for a local lattice-server.
//
// Contract: every response is an envelope {"status":"ok","result":...}; any
// non-2xx status, non-JSON body, or status !== "ok" is an error. Search scores
// are cosine DISTANCES (0 = identical), never similarities. Collection create
// uses capitalized distance "Cosine" (REST convention; the jsonl header uses
// lowercase "cosine"). BM25 query scores are SIMILARITIES (higher = better).
// Snapshot export/import move raw bytes (format 2: "LTDB" | u32 LE format |
// u32 LE config_len | config JSON | ...), not envelopes.

import { sleep } from './clock.mjs';

/** The HTTP implementation of the core's LatticeStore port. @implements {import('../ports.mjs').LatticeStore} */
export class LatticeClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async send(method, path, body, contentType) {
    try {
      return await fetch(this.baseUrl + path, { method, headers: { 'Content-Type': contentType }, body });
    } catch (e) {
      throw new Error(`lattice ${method} ${path}: connection failed (${e.cause?.code ?? e.message})`);
    }
  }

  async request(method, path, body, rawBytes = false) {
    const res = await this.send(
      method, path, rawBytes ? body : body === undefined ? undefined : JSON.stringify(body),
      rawBytes ? 'application/octet-stream' : 'application/json',
    );
    const raw = await res.text();
    if (!res.ok) {
      throw new Error(`lattice ${method} ${path}: HTTP ${res.status} - ${raw.slice(0, 500)}`);
    }
    let envelope;
    try {
      envelope = JSON.parse(raw);
    } catch {
      throw new Error(`lattice ${method} ${path}: non-JSON response: ${raw.slice(0, 200)}`);
    }
    if (envelope.status !== 'ok') {
      throw new Error(
        `lattice ${method} ${path}: status ${JSON.stringify(envelope.status)} - ${raw.slice(0, 500)}`,
      );
    }
    return envelope.result;
  }

  /** Poll GET /collections until the server answers, up to timeoutMs. */
  async waitReady(timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    let lastError;
    for (;;) {
      try {
        await this.request('GET', '/collections');
        return;
      } catch (e) {
        lastError = e;
      }
      if (Date.now() >= deadline) {
        throw new Error(`lattice-server not ready within ${timeoutMs}ms: ${lastError.message}`);
      }
      await sleep(200);
    }
  }

  createCollection(name, dim) {
    return this.request('PUT', `/collections/${encodeURIComponent(name)}`, {
      vectors: { size: dim, distance: 'Cosine' },
    });
  }

  /** points: [{id, vector, payload}] */
  upsertBatch(name, points) {
    return this.request('PUT', `/collections/${encodeURIComponent(name)}/points`, { points });
  }

  /** Returns an array of {id, version, score, payload}; score is a cosine distance. */
  search(name, vector, limit) {
    return this.request('POST', `/collections/${encodeURIComponent(name)}/points/search`, {
      vector,
      limit,
      with_payload: true,
    });
  }

  /** Returns {points: [{id, payload?, vector?}]}. */
  scroll(name, { limit, withPayload = false, withVector = true }) {
    return this.request('POST', `/collections/${encodeURIComponent(name)}/points/scroll`, {
      limit,
      with_payload: withPayload,
      with_vector: withVector,
    });
  }

  /** Returns {status, points_count, config, ...}. */
  collectionInfo(name) {
    return this.request('GET', `/collections/${encodeURIComponent(name)}`);
  }

  /** v3: create from a full REST body (vectors optional, text_index, embedding, hnsw_config). */
  createCollectionFrom(name, body) {
    return this.request('PUT', `/collections/${encodeURIComponent(name)}`, body);
  }

  deleteCollection(name) {
    return this.request('DELETE', `/collections/${encodeURIComponent(name)}`);
  }

  /** Install snapshot bytes as `name` (mode create|replace|merge). */
  importSnapshot(name, bytes, mode) {
    return this.request('POST', `/collections/${encodeURIComponent(name)}/import?mode=${mode}`, bytes, true);
  }

  addEdge(name, { from, to, rel, w }) {
    return this.request('POST', `/collections/${encodeURIComponent(name)}/graph/edges`, {
      from_id: from, to_id: to, relation: rel, weight: w,
    });
  }

  /** Universal query (BM25 / dense-from-text / hybrid). Returns {points: [{id, score, payload}]}. */
  query(name, body) {
    return this.request('POST', `/collections/${encodeURIComponent(name)}/points/query`, body);
  }

  /** Every point, paging scroll by next_page_offset. */
  async scrollAll(name, { pageSize, withPayload, withVector }) {
    const out = [];
    let offset;
    for (;;) {
      const page = await this.request('POST', `/collections/${encodeURIComponent(name)}/points/scroll`, {
        limit: pageSize, offset, with_payload: withPayload, with_vector: withVector,
      });
      out.push(...(page?.points ?? []));
      if (page?.next_page_offset === undefined || page.next_page_offset === null) return out;
      offset = page.next_page_offset;
    }
  }

  /** The collection's snapshot bytes (GET /collections/{name}/export). */
  async exportSnapshot(name) {
    const path = `/collections/${encodeURIComponent(name)}/export`;
    const res = await this.send('GET', path, undefined, 'application/json');
    if (!res.ok) throw new Error(`lattice GET ${path}: HTTP ${res.status} - ${(await res.text()).slice(0, 500)}`);
    return Buffer.from(await res.arrayBuffer());
  }
}
