// lattice.mjs — minimal REST client for a local lattice-server.
//
// Contract: every response is an envelope {"status":"ok","result":...}; any
// non-2xx status, non-JSON body, or status !== "ok" is an error. Search scores
// are cosine DISTANCES (0 = identical), never similarities. Collection create
// uses capitalized distance "Cosine" (REST convention; the jsonl header uses
// lowercase "cosine").

import { sleep } from './util.mjs';

export class LatticeClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async request(method, path, body) {
    let res;
    try {
      res = await fetch(this.baseUrl + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      throw new Error(`lattice ${method} ${path}: connection failed (${e.cause?.code ?? e.message})`);
    }
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
  async waitReady(timeoutMs = 10_000) {
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
}
