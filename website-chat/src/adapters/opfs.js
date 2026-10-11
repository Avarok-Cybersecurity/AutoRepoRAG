// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// opfs.js — Origin Private File System cache for the decompressed corpora.
// All OPFS I/O for the chat lives here (SBIO); callers never touch
// navigator.storage directly. Layout (core/cache-names.js): one corpus file
// per (corpus id, commit) at the OPFS root, plus a sidecar meta.json written
// after the corpus commits, so the corpus can be served offline.
//
// Crash safety: createWritable() writes to a browser-managed swap file that is
// only committed on close(), so an interrupted write never leaves a partial
// corpus behind — abort()/discard() (or a tab crash) simply drops the swap.
// =============================================================================

import { corpusFileName, metaFileName, parseCorpusFileName, parseMetaFileName } from '../core/cache-names.js';

/**
 * @param {string} keyPrefix  config.storage.keyPrefix
 * @param {{getDirectory: null | (() => Promise<FileSystemDirectoryHandle>)}} io
 *   null when the browser has no OPFS (some private-browsing modes); every
 *   call then degrades to "no cache".
 */
export function createOpfsCache(keyPrefix, io) {
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
   * Streaming writer for the corpus (id, sha). Returns null when OPFS is
   * unavailable (caller degrades to no-cache streaming). The file only
   * becomes visible to getCachedCorpus() after finalize(); discard() drops
   * everything.
   */
  async function createCorpusWriter(id, sha) {
    const dir = await root();
    if (!dir) return null;
    const name = corpusFileName(keyPrefix, id, sha);
    let writable;
    try {
      const handle = await dir.getFileHandle(name, { create: true });
      writable = await handle.createWritable({ keepExistingData: false });
    } catch {
      return null;
    }
    let open = true;
    return {
      async write(chunk) {
        if (!open) return;
        await writable.write(chunk);
      },
      async finalize() {
        if (!open) return;
        open = false;
        await writable.close();
      },
      async discard() {
        if (!open) return;
        open = false;
        await writable.abort().catch(() => undefined);
        // Remove any pre-existing file the create:true call may have created
        // empty, so a later cache probe cannot see a zero-byte corpus.
        await dir.removeEntry(name).catch(() => undefined);
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

  /** Every cache entry of corpus `id`: [{ name, sha, kind: 'corpus'|'meta', lastModified, handle }]. */
  async function entries(dir, id) {
    const out = [];
    try {
      for await (const [name, handle] of dir) {
        if (handle.kind !== 'file') continue;
        const corpusSha = parseCorpusFileName(keyPrefix, id, name);
        const metaSha = corpusSha ? null : parseMetaFileName(keyPrefix, id, name);
        if (!corpusSha && !metaSha) continue;
        try {
          const file = await handle.getFile();
          out.push({ name, sha: corpusSha ?? metaSha, kind: corpusSha ? 'corpus' : 'meta', lastModified: file.lastModified, file });
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
   * Delete every cached file of corpus `id` except those for `keepSha`.
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
    for (const entry of await entries(dir, id)) {
      if (entry.sha === keepSha) continue;
      await dir.removeEntry(entry.name).catch(() => undefined);
    }
  }

  return { getCachedCorpus, createCorpusWriter, writeMeta, newestOffline, pruneStale };
}
