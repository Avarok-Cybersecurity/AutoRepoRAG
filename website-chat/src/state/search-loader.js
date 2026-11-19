// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// search-loader.js — drives a search session's reactive `chat` to 'ready':
// every corpus's manifest (or its cached copy when offline) -> how each is
// queried (core/search.js planFor: a corpus without a snapshot, or one the
// configured embedder cannot search, fails here as 'config') -> the OPFS
// lookup, where a cached snapshot is read and checksummed -> when anything
// is missing, the visitor's consent (state/load-gate.js) -> wasm init and
// the embedder -> per corpus, the cached bytes OR a bounded download whose
// SHA-256 must equal the manifest's snapshot_sha256 -> install the snapshot
// -> commit a download to OPFS -> ready.
//
// Verification comes before installation, and installation before caching,
// so neither the engine nor the cache ever holds bytes the manifest did not
// vouch for. A cached snapshot that fails its checksum is treated as absent
// (downloaded again, after consent), never installed.
//
// Status walk per corpus: downloading -> indexing (or loading-cached ->
// indexing). All I/O goes through the injected ports.
// =============================================================================

import { corpusFaultKind } from '../core/ask-errors.js';
import { missingDownload } from '../core/consent.js';
import { checkedEmbed, planFor } from '../core/search.js';
import { validateSearchMeta } from '../core/search-meta.js';
import { createLoadGate, resolveManifest as resolveWith } from './load-gate.js';

/**
 * @param {object} deps
 * @param {import('./load-gate.js').LoadChat & {corpora: object[]}} deps.chat  the session's $state object
 * @param {Array<{id: string, snapshotUrl: string, metaUrl: string}>} deps.corpora  config.corpora
 * @param {import('../core/search.js').SiteEmbedder|null} deps.embedder  config.search.embedder
 * @param {object} deps.ports
 * @param {ReturnType<typeof import('../adapters/lattice-search.js').createLatticeSearch>} deps.ports.search
 * @param {ReturnType<typeof import('../adapters/opfs.js').createOpfsCache>} deps.ports.cache  over SNAPSHOT_LAYOUT
 * @param {ReturnType<typeof import('../adapters/corpus.js').createCorpusNet>} deps.ports.net
 * @param {() => Promise<number|null>} deps.ports.wasmBytes  bytes the engine still has to fetch
 * @param {(bytes: Uint8Array) => Promise<string>} deps.ports.sha256  lowercase hex
 * @param {(err: unknown) => void} deps.ports.reportCacheFault  cache failures never decide a load
 */
export function createSearchLoader({ chat, corpora, embedder, ports }) {
  const { search, cache, net, wasmBytes, sha256, reportCacheFault } = ports;

  let controller = null; // AbortController for the current snapshot download
  let writer = null; // OPFS writer while a verified download is committed
  let engineReady = false; // wasm initialized (and the embedder set) once this session

  const gate = createLoadGate(chat, {
    cancelIo() {
      controller?.abort();
      const w = writer;
      writer = null;
      if (w) w.discard().catch(reportCacheFault);
    },
    settled() {
      controller = null;
      writer = null;
    },
  });
  const { fail, throwIfAborted } = gate;
  const resolveManifest = (token, corpus) => resolveWith({ chat, net, cache, gate, validate: validateSearchMeta }, token, corpus);

  const verified = async (p, bytes) => (await sha256(bytes)) === p.meta.snapshot.sha256;

  async function load(token) {
    chat.status = 'manifest';
    const plan = [];
    for (const corpus of corpora) plan.push(await resolveManifest(token, corpus));

    let queries;
    try {
      queries = plan.map((p) => planFor(p.meta, embedder, p.corpus.id));
    } catch (err) {
      throw fail('config', err);
    }

    // Cached snapshots are read and checksummed now: one that fails is a miss.
    for (const p of plan) {
      if (!p.file) p.file = await cache.getCachedCorpus(p.corpus.id, p.meta.commitSha, p.meta.snapshot.bytes);
      p.bytes = p.file ? new Uint8Array(await p.file.arrayBuffer()) : null;
      if (p.bytes && !(await verified(p, p.bytes))) {
        reportCacheFault(new Error(`cached snapshot of "${p.corpus.id}" at ${p.meta.commitSha} failed its checksum; downloading it again`));
        p.file = null;
        p.bytes = null;
      }
      throwIfAborted(token);
    }

    const sized = (p) => ({ corpus: p.corpus, file: p.file, meta: { gzBytes: p.meta.snapshot.bytes, bytes: p.meta.snapshot.bytes } });
    await gate.consentTo(token, async () => (plan.some((p) => !p.file) ? missingDownload(plan.map(sized), engineReady ? 0 : await wasmBytes()) : null));

    chat.status = 'wasm-init';
    try {
      await search.init();
      if (!engineReady && embedder !== null && queries.some((q) => q.kind !== 'bm25')) search.setEmbedder(embedder.model, embedder.dim, checkedEmbed(embedder));
    } catch (err) {
      throw fail('wasm', err);
    }
    engineReady = true;
    throwIfAborted(token);
    chat.progress.totalBytes = plan.reduce((n, p) => n + p.meta.snapshot.bytes, 0);
    chat.progress.totalPoints = plan.reduce((n, p) => n + p.meta.points, 0);

    const loaded = [];
    for (const [i, p] of plan.entries()) {
      const fromCache = p.bytes !== null;
      const bytes = fromCache ? useCached(p) : await download(token, p);
      throwIfAborted(token);
      chat.status = 'indexing';
      try {
        search.install(p.corpus.id, bytes);
      } catch (err) {
        throw fail('corpus', err);
      }
      p.bytes = null;
      chat.progress.indexed += p.meta.points;
      if (!fromCache) await commitCache(token, p, bytes);
      await cache.writeMeta(p.corpus.id, p.meta.commitSha, p.raw);
      await cache.pruneStale(p.corpus.id, p.meta.commitSha).catch(reportCacheFault);
      throwIfAborted(token);
      loaded.push({
        id: p.corpus.id,
        collection: p.corpus.id,
        commit: p.meta.commitSha,
        repo: p.meta.repo,
        files: p.meta.files,
        chunks: p.meta.points,
        plan: queries[i],
        generatedAt: p.meta.generatedAt,
      });
    }
    chat.corpora = loaded;
    chat.status = 'ready';
  }

  function useCached(p) {
    chat.status = 'loading-cached';
    chat.progress.loadedBytes += p.bytes.byteLength;
    return p.bytes;
  }

  async function download(token, p) {
    chat.status = 'downloading';
    controller = new AbortController();
    let bytes;
    try {
      bytes = await net.readSnapshot(p.corpus.snapshotUrl, {
        signal: controller.signal,
        maxBytes: p.meta.snapshot.bytes,
        onBytes: (n) => {
          chat.progress.loadedBytes += n;
        },
      });
    } catch (err) {
      throwIfAborted(token);
      if (err?.name === 'AbortError') throw err;
      throw fail(corpusFaultKind(err), err);
    }
    throwIfAborted(token);
    if (!(await verified(p, bytes))) {
      throw fail('corpus', new Error(`the snapshot of "${p.corpus.id}" does not match its manifest's snapshot_sha256, so it was not installed`));
    }
    return bytes;
  }

  /** Keep an installed download for the next visit; a failure only costs the cache, and is reported. */
  async function commitCache(token, p, bytes) {
    writer = await cache.createCorpusWriter(p.corpus.id, p.meta.commitSha).catch((err) => {
      reportCacheFault(err);
      return null;
    });
    const w = writer;
    if (!w) return;
    try {
      await w.write(bytes);
      throwIfAborted(token);
      await w.finalize();
    } catch (err) {
      if (writer === w) await w.discard().catch(reportCacheFault);
      if (token.aborted) throw err;
      reportCacheFault(err);
    } finally {
      writer = null;
    }
  }

  return { ensureReady: () => gate.ensureReady(load), abortLoad: gate.abortLoad, accept: gate.accept };
}
