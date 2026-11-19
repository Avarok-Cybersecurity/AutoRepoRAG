// vectors.mjs — vectors for every chunk: reuse from a previous corpus by
// chunk_hash (guarded by model + dim, from its meta.json), embed the rest
// (mock or live), then quantize (significant digits + fround) so the values
// upserted and the values exported are the same.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { gunzip, isGzipBytes, log, quantizeVector, warning } from './util.mjs';
import { embedTexts, mockEmbedding } from './embed.mjs';
import { parseCorpus } from './jsonl.mjs';

async function fetchBytes(url) {
  if (url.startsWith('file://')) return readFileSync(fileURLToPath(url));
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`previous corpus URLs must be file:// or http(s)://, got ${url}`);
}

/**
 * Load a previous corpus for incremental reuse. Its meta.json (the explicit
 * previous-corpus-meta-url) declares which model produced it; without a
 * verifiable model match the cache is discarded (a corpus of foreign vectors
 * mixed into fresh ones would verify and still be garbage).
 */
export async function loadPreviousCorpus(url, metaUrl, expectedModel, expectedDim) {
  let dump;
  let metaModel = null;
  try {
    let bytes = await fetchBytes(url);
    if (isGzipBytes(bytes)) bytes = gunzip(bytes);
    dump = parseCorpus(bytes.toString('utf8'));
  } catch (e) {
    warning(`previous-corpus-url unusable, doing a full embed: ${e.message}`);
    return null;
  }
  try {
    metaModel = JSON.parse((await fetchBytes(metaUrl)).toString('utf8')).model ?? null;
  } catch (e) {
    warning(`previous corpus meta ${metaUrl} unreadable (${e.message})`);
  }
  if (metaModel !== expectedModel) {
    warning(
      `previous corpus discarded: model ${JSON.stringify(metaModel)} != current ${JSON.stringify(expectedModel)}`,
    );
    return null;
  }
  if (expectedDim !== null && dump.header.dim !== expectedDim) {
    warning(`previous corpus discarded: dim ${dump.header.dim} != current ${expectedDim}`);
    return null;
  }
  const byHash = new Map();
  for (const p of dump.points) {
    const hash = p.payload?.chunk_hash;
    if (typeof hash === 'string' && p.vector.length === dump.header.dim) {
      byHash.set(hash, p.vector);
    }
  }
  log(`[reuse] previous corpus loaded: ${byHash.size} reusable vectors (dim ${dump.header.dim})`);
  return { dim: dump.header.dim, byHash };
}

/** Resolve vectors for every chunk: reuse by chunk_hash, embed the rest. */
export async function resolveVectors(chunks, inputs, prev) {
  const rawByHash = new Map();
  let dim;
  let reused = 0;

  if (prev) {
    for (const c of chunks) {
      if (prev.byHash.has(c.chunkHash) && !rawByHash.has(c.chunkHash)) {
        rawByHash.set(c.chunkHash, prev.byHash.get(c.chunkHash));
        reused += 1;
      }
    }
  }
  const missing = chunks.filter((c) => !rawByHash.has(c.chunkHash));

  if (inputs.mock) {
    dim = inputs.mockDim;
    // Seed by TEXT (not chunk_hash, which mixes in the path) so byte-identical
    // chunks in different files embed identically — matching live-embedder
    // behavior, which is what makes the tie-tolerant verify testable in CI.
    for (const c of missing) rawByHash.set(c.chunkHash, mockEmbedding(c.payload.text, dim));
  } else if (missing.length === 0) {
    dim = prev.dim; // everything reused; prev model already matched
  } else {
    log(`[embed] embedding ${missing.length}/${chunks.length} chunks via ${inputs.endpoint} (${inputs.model})`);
    const opts = {
      endpoint: inputs.endpoint, model: inputs.model, apiKey: inputs.apiKey,
      batchSize: inputs.batchSize, requestIntervalMs: inputs.requestIntervalMs,
      maxRetries: inputs.maxRetries,
    };
    const first = await embedTexts(missing.map((c) => c.payload.text), opts);
    dim = first.dim;
    missing.forEach((c, i) => rawByHash.set(c.chunkHash, first.vectors[i]));
    if (prev && reused > 0 && dim !== prev.dim) {
      warning(`previous corpus discarded mid-run: live dim ${dim} != cached dim ${prev.dim}; re-embedding reused chunks`);
      const stale = chunks.filter((c) => prev.byHash.has(c.chunkHash) && rawByHash.get(c.chunkHash) === prev.byHash.get(c.chunkHash));
      if (stale.length > 0) {
        const redo = await embedTexts(stale.map((c) => c.payload.text), opts);
        if (redo.dim !== dim) throw new Error(`embedding dim drifted within one run: ${redo.dim} != ${dim}`);
        stale.forEach((c, i) => rawByHash.set(c.chunkHash, redo.vectors[i]));
      }
      reused = 0;
    }
  }

  const points = chunks.map((c) => ({
    id: c.id,
    vector: quantizeVector(rawByHash.get(c.chunkHash), inputs.vectorPrecision),
    payload: c.payload,
  }));
  return { points, dim, embedded: chunks.length - reused, reused };
}
