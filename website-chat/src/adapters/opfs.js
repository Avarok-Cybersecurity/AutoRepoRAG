// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// opfs.js — Origin Private File System cache for the decompressed corpora.
// All OPFS I/O for the chat lives here (SBIO); callers never touch
// navigator.storage directly. Layout (core/cache-names.js): one corpus file
// per (corpus id, commit) at the OPFS root, plus a sidecar meta.json written
// after the corpus commits, so the corpus can be served offline.
//
// Atomic commit: a download is written to "<name>.jsonl.part" and moved to
// the corpus name only by finalize(), after the caller has parsed the whole
// stream, so a failed or interrupted download never sits under the name the
// cache serves. discard() removes the partial; pruneStale() sweeps any left
// over (a crashed tab, a removal that failed).
//
// Chromium releases a writable's lock asynchronously: right after abort() or
// close() resolves, removeEntry()/move() on that file can still fail with
// NoModificationAllowedError (seen 8 times in 60 runs on Linux). That one
// error is retried with a short backoff; any other failure, or one that
// outlasts the retries, is thrown as a CacheCleanupError naming the file.
// Nothing here swallows a removal error.
// =============================================================================

import { corpusFileName, metaFileName, parseCorpusFileName, parseMetaFileName, parsePartialFileName, partialFileName } from '../core/cache-names.js';

// Backoff between attempts while a released lock settles (~0.8 s in all).
const LOCK_SETTLE_DELAYS_MS = [10, 25, 50, 100, 200, 400];

/** A cache file that could not be removed or committed. */
export class CacheCleanupError extends Error {
  constructor(message, cause) {
    super(`${message}: ${cause?.name ?? 'Error'}: ${cause?.message ?? cause}`, { cause });
    this.name = 'CacheCleanupError';
  }
}

/**
 * @param {string} keyPrefix  config.storage.keyPrefix
 * @param {{getDirectory: null | (() => Promise<FileSystemDirectoryHandle>), sleep: (ms: number) => Promise<void>}} io
 *   getDirectory is null when the browser has no OPFS (some private-browsing
 *   modes); every call then degrades to "no cache". sleep paces the retries.
 */
export function createOpfsCache(keyPrefix, io) {
  /** Run `op`, retrying only the lock-release lag; throws a CacheCleanupError otherwise. */
  async function settled(what, op) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await op();
      } catch (err) {
        if (err?.name !== 'NoModificationAllowedError' || attempt >= LOCK_SETTLE_DELAYS_MS.length) throw new CacheCleanupError(what, err);
        await io.sleep(LOCK_SETTLE_DELAYS_MS[attempt]);
      }
    }
  }

  /** Remove `name`; one already gone counts as removed. */
  function removeFile(dir, name) {
    return settled(`could not remove ${name}`, async () => {
      try {
        await dir.removeEntry(name);
      } catch (err) {
        if (err?.name !== 'NotFoundError') throw err;
      }
    });
  }

  async function root() {
    if (!io.getDirectory) return null;
    try {
      return await io.getDirectory();
    } catch {
      return null;
    }
  }

  /**
   * The cached decompressed corpus for (id, sha) as a File, or null when
   * absent/unsupported. A size mismatch against the manifest's `bytes` is a
   * miss, so a wrong-sized file is never served.
   */
  async function getCachedCorpus(id, sha, expectedBytes) {
    const dir = await root();
    if (!dir) return null;
    try {
      const file = await (await dir.getFileHandle(corpusFileName(keyPrefix, id, sha))).getFile();
      if (expectedBytes !== null && file.size !== expectedBytes) return null;
      return file;
    } catch {
      return null;
    }
  }

  /**
   * Streaming writer for the corpus (id, sha), writing to its partial name.
   * Returns null when OPFS is unavailable or will not open a writable (the
   * caller degrades to no-cache streaming). finalize() closes the partial
   * and moves it to the corpus name, the only point at which
   * getCachedCorpus() can see it; discard() removes the partial. Both throw
   * a CacheCleanupError when the file system will not do it.
   */
  async function createCorpusWriter(id, sha) {
    const dir = await root();
    if (!dir) return null;
    const partial = partialFileName(keyPrefix, id, sha);
    const target = corpusFileName(keyPrefix, id, sha);
    let handle;
    let writable;
    try {
      handle = await dir.getFileHandle(partial, { create: true });
      writable = await handle.createWritable({ keepExistingData: false });
    } catch {
      // No usable OPFS writable: stream without caching. create:true may
      // already have made the partial, so remove it (a failure is thrown).
      if (handle) await removeFile(dir, partial);
      return null;
    }
    let state = 'open'; // 'open' | 'closed' (bytes written, not yet moved) | 'done'
    return {
      async write(chunk) {
        if (state !== 'open') return;
        await writable.write(chunk);
      },
      async finalize() {
        if (state !== 'open') return;
        await writable.close();
        state = 'closed';
        if (typeof handle.move !== 'function') throw new CacheCleanupError(`could not commit ${partial}`, new Error('this browser cannot move OPFS files'));
        // A stale file under the corpus name (a size mismatch) gives way.
        await removeFile(dir, target);
        await settled(`could not commit ${partial}`, () => handle.move(target));
        state = 'done';
      },
      async discard() {
        if (state === 'done') return;
        if (state === 'open') {
          state = 'closed';
          await writable.abort();
        }
        await removeFile(dir, partial);
        state = 'done';
      },
    };
  }

  /** Store the raw manifest beside its corpus (best-effort). */
  async function writeMeta(id, sha, rawMeta) {
    const dir = await root();
    if (!dir) return;
    try {
      const handle = await dir.getFileHandle(metaFileName(keyPrefix, id, sha), { create: true });
      const w = await handle.createWritable({ keepExistingData: false });
      await w.write(JSON.stringify(rawMeta));
      await w.close();
    } catch {
      // A missing sidecar only costs the offline path for this corpus.
    }
  }

  /** Every cache entry of corpus `id`: [{ name, sha, kind: 'corpus'|'meta'|'partial', lastModified, file }]. */
  async function entries(dir, id) {
    const out = [];
    const kinds = [
      ['corpus', parseCorpusFileName],
      ['meta', parseMetaFileName],
      ['partial', parsePartialFileName],
    ];
    try {
      for await (const [name, handle] of dir) {
        if (handle.kind !== 'file') continue;
        const match = kinds.map(([kind, parse]) => [kind, parse(keyPrefix, id, name)]).find(([, sha]) => sha);
        if (!match) continue;
        try {
          const file = await handle.getFile();
          out.push({ name, sha: match[1], kind: match[0], lastModified: file.lastModified, file });
        } catch {
          // Unreadable entry: skip rather than break the listing.
        }
      }
    } catch {
      return out;
    }
    return out;
  }

  /**
   * The newest cached corpus of `id` that still has its meta sidecar, as
   * { sha, file, rawMeta }, or null. Used only when the manifest is
   * unreachable; the caller validates rawMeta like a fresh manifest.
   */
  async function newestOffline(id) {
    const dir = await root();
    if (!dir) return null;
    const all = await entries(dir, id);
    const metas = new Map(all.filter((e) => e.kind === 'meta').map((e) => [e.sha, e.file]));
    const corpora = all.filter((e) => e.kind === 'corpus' && metas.has(e.sha)).sort((a, b) => b.lastModified - a.lastModified);
    for (const c of corpora) {
      try {
        return { sha: c.sha, file: c.file, rawMeta: JSON.parse(await metas.get(c.sha).text()) };
      } catch {
        // Unparseable sidecar: try the next one.
      }
    }
    return null;
  }

  /**
   * Delete every cached file of corpus `id` except the corpus and meta for
   * `keepSha`, and every partial download of it (a download in progress is
   * never pruned: callers prune only after their own download committed).
   * Every removal is attempted; the ones that fail are thrown together as one
   * CacheCleanupError naming them.
   *
   * Refuses a falsy or non-string sha. The failure mode if one got through is
   * not "prunes the wrong file", it is "deletes ALL of them": no cached name
   * matches an undefined sha, so every real entry takes the delete branch.
   * Both callers pass the sha of a VALIDATED manifest (core/manifest.js) —
   * the offline path validates its sidecar exactly like a fresh one.
   */
  async function pruneStale(id, keepSha) {
    if (typeof keepSha !== 'string' || keepSha === '') return;
    const dir = await root();
    if (!dir) return;
    const failed = [];
    for (const entry of await entries(dir, id)) {
      if (entry.sha === keepSha && entry.kind !== 'partial') continue;
      try {
        await removeFile(dir, entry.name);
      } catch (err) {
        failed.push(err);
      }
    }
    if (failed.length > 0) throw new CacheCleanupError(`could not prune ${failed.length} file(s)`, new Error(failed.map((e) => e.message).join('; ')));
  }

  return { getCachedCorpus, createCorpusWriter, writeMeta, newestOffline, pruneStale };
}
