// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// loader.js — drives the session's reactive `chat` object to 'ready':
// wasm init -> every corpus's manifest (or its cached copy when offline) ->
// one shared embedding space -> per corpus, an OPFS-cached load OR a streamed
// download (fetch -> DecompressionStream -> tee to OPFS + parser) -> batched
// indexing into that corpus's own collection -> ready.
//
// All I/O goes through the injected ports; this file only sequences it and
// writes state. Status walk per corpus: downloading -> caching -> indexing
// (or loading-cached -> indexing), so several corpora repeat the walk.
// =============================================================================

import { classifyStreamError } from '../core/ask-errors.js';
import { createLineSplitter, parseHeader, parsePoint } from '../core/jsonl.js';
import { sharedEmbedding, validateMeta } from '../core/manifest.js';

class AbortedError extends Error {
  constructor() {
    super('load aborted');
    this.name = 'AbortError';
  }
}

/** A load step failed and already recorded its error kind on `chat`. */
class FailedError extends Error {
  constructor() {
    super('load failed');
    this.name = 'FailedError';
  }
}

/**
 * @param {object} deps
 * @param {object} deps.chat       the session's $state object
 * @param {Array<{id: string, gzUrl: string, metaUrl: string}>} deps.corpora
 * @param {number} deps.upsertBatch
 * @param {object} deps.ports      { lattice, cache, net, idleYield }
 */
export function createLoader({ chat, corpora, upsertBatch, ports }) {
  const { lattice, cache, net, idleYield } = ports;

  let loadPromise = null; // in-flight ensureReady(); cleared on error/abort
  let controller = null; // AbortController for the current corpus download
  let writer = null; // OPFS corpus writer (partial file cleanup on abort)
  let loadToken = null; // { aborted } — lets abortLoad() stop non-fetch phases

  const throwIfAborted = (token) => {
    if (token.aborted) throw new AbortedError();
  };

  function resetProgress() {
    chat.progress.loadedBytes = 0;
    chat.progress.totalBytes = 0;
    chat.progress.indexed = 0;
    chat.progress.totalPoints = 0;
  }

  function fail(kind, err) {
    chat.status = 'error';
    chat.error = { kind, message: err?.message ? String(err.message) : String(err) };
    return new FailedError();
  }

  async function dropWriter() {
    const w = writer;
    writer = null;
    if (w) await w.discard().catch(() => undefined);
  }

  /**
   * Drive the machine to 'ready'. Idempotent: concurrent calls share one
   * load; re-calling after an error retries from scratch. Resolves when the
   * machine settles ('ready' or 'error' — errors are reported via chat.error,
   * not by rejecting, so callers never need their own catch for state).
   */
  function ensureReady() {
    if (chat.status === 'ready') return Promise.resolve();
    if (loadPromise) return loadPromise;

    const token = { aborted: false };
    loadToken = token;
    loadPromise = load(token)
      .catch((err) => {
        // abortLoad() already restored 'idle' — not an error state.
        if (token.aborted || err?.name === 'AbortError' || err instanceof FailedError) return;
        if (!chat.error) fail('corpus', err);
      })
      .finally(() => {
        if (chat.status !== 'ready') loadPromise = null;
        if (loadToken === token) loadToken = null;
        controller = null;
        writer = null;
      });
    return loadPromise;
  }

  /** Abort an in-flight load: cancel the fetch, drop any partial OPFS file. */
  function abortLoad() {
    if (chat.status === 'ready' || chat.status === 'idle') return;
    if (loadToken) loadToken.aborted = true;
    controller?.abort();
    const w = writer;
    writer = null;
    if (w) w.discard().catch(() => undefined);
    loadPromise = null;
    chat.error = null;
    chat.offline = false;
    resetProgress();
    chat.status = 'idle';
  }

  async function load(token) {
    chat.error = null;
    chat.offline = false;
    resetProgress();

    // 1) wasm
    chat.status = 'wasm-init';
    try {
      await lattice.init();
    } catch (err) {
      throw fail('wasm', err);
    }
    throwIfAborted(token);

    // 2) every manifest preflight (tiny meta.json: sha/size/dim/model)
    chat.status = 'manifest';
    const plan = [];
    for (const corpus of corpora) plan.push(await resolveManifest(token, corpus));

    // 3) one question embedding searches every corpus, so they must agree
    let embedding;
    try {
      embedding = sharedEmbedding(plan.map((p) => ({ id: p.corpus.id, meta: p.meta })));
    } catch (err) {
      throw fail('config', err);
    }

    // 4) OPFS hits are served with zero corpus network
    for (const p of plan) {
      if (!p.file) p.file = await cache.getCachedCorpus(p.corpus.id, p.meta.commitSha, p.meta.bytes);
      throwIfAborted(token);
    }
    chat.progress.totalBytes = plan.reduce((n, p) => n + (p.file ? p.file.size : p.meta.gzBytes), 0);
    chat.progress.totalPoints = plan.reduce((n, p) => n + p.meta.points, 0);

    // 5) index each corpus into its own collection
    const loaded = [];
    for (const p of plan) {
      const header = p.file ? await loadFromFile(token, p) : await loadFromNetwork(token, p);
      throwIfAborted(token);
      loaded.push({
        id: p.corpus.id,
        collection: p.corpus.id,
        commit: p.meta.commitSha,
        repo: p.meta.repo,
        files: p.meta.files,
        chunks: header.points ?? p.meta.points,
        dim: header.dim,
        generatedAt: p.meta.generatedAt,
      });
    }
    chat.corpora = loaded;
    chat.embedding = embedding;
    chat.status = 'ready';
  }

  /**
   * The validated manifest of `corpus`. When it is unreachable or invalid,
   * fall back to the newest cached copy of that corpus (the offline path);
   * with no cached copy the load fails as 'manifest'.
   */
  async function resolveManifest(token, corpus) {
    let raw;
    try {
      raw = await net.fetchMeta(corpus.metaUrl);
      return { corpus, raw, meta: validateMeta(raw, corpus.id), file: null };
    } catch (err) {
      throwIfAborted(token);
      const cached = await cache.newestOffline(corpus.id);
      throwIfAborted(token);
      if (!cached) throw fail('manifest', err);
      let meta;
      try {
        meta = validateMeta(cached.rawMeta, corpus.id);
      } catch {
        throw fail('manifest', err);
      }
      if (meta.commitSha !== cached.sha) throw fail('manifest', err);
      chat.offline = true;
      return { corpus, raw: cached.rawMeta, meta, file: cached.file };
    }
  }

  // Serve a previously cached decompressed corpus from OPFS.
  async function loadFromFile(token, p) {
    chat.status = 'loading-cached';
    return indexByteStream(token, p.file.stream(), {
      collection: p.corpus.id,
      expectedDim: p.meta.dim,
      tee: null,
      countBytes: true,
      onDrained: async () => {
        await cache.writeMeta(p.corpus.id, p.meta.commitSha, p.raw);
        await cache.pruneStale(p.corpus.id, p.meta.commitSha);
      },
    });
  }

  // Stream-download the corpus, decompressing and indexing as bytes arrive,
  // while teeing the decompressed stream into an OPFS write.
  async function loadFromNetwork(token, p) {
    const { id } = p.corpus;
    const sha = p.meta.commitSha;
    chat.status = 'downloading';
    controller = new AbortController();

    let opened;
    try {
      opened = await net.openCorpus(p.corpus.gzUrl, controller.signal);
    } catch (err) {
      throwIfAborted(token);
      if (err?.name === 'AbortError') throw err;
      throw fail('corpus', err);
    }

    // Determinate progress: Content-Length when the server provides it for
    // the gz transfer, else the manifest's recorded gz size (already summed).
    if (opened.contentLength !== null) chat.progress.totalBytes += opened.contentLength - p.meta.gzBytes;

    // Count compressed bytes as they arrive (drives the download progress bar).
    const counted = opened.body.pipeThrough(
      new TransformStream({
        transform(chunk, ctrl) {
          chat.progress.loadedBytes += chunk.byteLength;
          ctrl.enqueue(chunk);
        },
      })
    );
    const decompressed = net.gunzip(counted);
    if (decompressed === null) {
      throw fail('decompress', new Error('this browser lacks DecompressionStream (gzip) support'));
    }

    // OPFS writer for the decompressed corpus; null when OPFS is unavailable
    // (private browsing) — we then stream without caching.
    writer = await cache.createCorpusWriter(id, sha);
    if (token.aborted) {
      // abortLoad() ran while the writer was being created (it saw writer ===
      // null and had nothing to discard) — discard here or the create:true
      // file and its open-writable swap leak in OPFS.
      await dropWriter();
      throw new AbortedError();
    }

    // Runs once the byte stream is fully drained (all bytes teed), BEFORE the
    // trailing 'indexing' flush — preserving the state order
    // downloading -> caching -> indexing.
    const commitCache = async () => {
      chat.status = 'caching';
      const w = writer;
      writer = null;
      if (w) {
        try {
          await w.finalize();
          await cache.writeMeta(id, sha, p.raw);
        } catch {
          // Cache write failure is non-fatal — the corpus is already indexed.
          await w.discard().catch(() => undefined);
        }
      }
      await cache.pruneStale(id, sha);
    };

    try {
      return await indexByteStream(token, decompressed, {
        collection: id,
        expectedDim: p.meta.dim,
        tee: writer,
        countBytes: false,
        onDrained: commitCache,
      });
    } catch (err) {
      await dropWriter();
      if (token.aborted || err?.name === 'AbortError') throw err;
      // A gzip stream that fails mid-flight surfaces here.
      throw fail(classifyStreamError(err), err);
    }
  }

  /**
   * Consume a byte stream of lattice-jsonl: parse the header line, create the
   * collection, then upsert points in upsertBatch batches with idle yields
   * so the main thread never holds a long task. Optionally tees raw bytes to
   * an OPFS writer and/or counts bytes into progress.loadedBytes.
   */
  async function indexByteStream(token, byteStream, { collection, expectedDim, tee, countBytes, onDrained }) {
    const reader = byteStream.getReader();
    const decoder = new TextDecoder();
    let header = null;
    let batch = [];

    const flush = async () => {
      if (batch.length === 0) return;
      // Mid-stream flushes keep the current status ('downloading' or
      // 'loading-cached'); the trailing flush after onDrained runs as
      // 'indexing'.
      lattice.upsert(collection, batch);
      chat.progress.indexed += batch.length;
      batch = [];
      await idleYield();
      throwIfAborted(token);
    };

    const lines = createLineSplitter(async (line) => {
      if (!header) {
        header = parseHeader(line, expectedDim);
        lattice.createCollection(collection, header.dim);
        return;
      }
      const point = parsePoint(line);
      if (point) batch.push(point);
      if (batch.length >= upsertBatch) await flush();
    });

    try {
      for (;;) {
        throwIfAborted(token);
        const { done, value } = await reader.read();
        if (done) break;
        if (tee) await tee.write(value);
        if (countBytes) chat.progress.loadedBytes += value.byteLength;
        await lines.push(decoder.decode(value, { stream: true }));
      }
      await lines.push(decoder.decode());
      await lines.end();
    } finally {
      reader.releaseLock?.();
    }

    if (!header) throw new Error('corpus stream ended before a header line');

    throwIfAborted(token);
    await onDrained();
    throwIfAborted(token);

    // Trailing points that arrived after the last mid-stream flush.
    chat.status = 'indexing';
    await flush();

    return header;
  }

  return { ensureReady, abortLoad };
}
