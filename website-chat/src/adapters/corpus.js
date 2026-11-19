// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// corpus.js — the corpus network I/O: the tiny manifest preflight, the
// streamed .jsonl.gz download (fetch -> byte count -> DecompressionStream)
// and, for search mode, the bounded .lattice snapshot download.
// =============================================================================

/**
 * A corpus request that failed, marked with whose problem it is: `network`
 * when no response came back (the visitor's connection), `status` when the
 * server answered with an error (the site's publishing).
 */
export class CorpusFetchError extends Error {
  constructor(message, { network, status }) {
    super(message);
    this.name = 'CorpusFetchError';
    this.network = network;
    this.status = status;
  }
}

/** @param {{fetch: typeof fetch}} io */
export function createCorpusNet(io) {
  /** fetch, with a rejection (no response) marked as network; a cancel stays an AbortError. */
  async function request(what, url, init) {
    try {
      return await io.fetch(url, init);
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      throw new CorpusFetchError(`${what} unreachable: ${err?.message ?? err}`, { network: true, status: null });
    }
  }

  const httpError = (what, res) => new CorpusFetchError(`${what} failed: HTTP ${res.status}`, { network: false, status: res.status });

  /** Fetch and parse a corpus meta.json. Throws on any network, HTTP or JSON failure. */
  async function fetchMeta(url) {
    const res = await request('manifest fetch', url, { cache: 'no-cache' });
    if (!res.ok) throw httpError('manifest fetch', res);
    return res.json();
  }

  /**
   * Start the gz download. Resolves { body, contentLength } (contentLength
   * null when the server sent none); throws on network or HTTP failure or no body.
   */
  async function openCorpus(url, signal) {
    const res = await request('corpus fetch', url, { signal });
    if (!res.ok) throw httpError('corpus fetch', res);
    if (!res.body) throw new Error('corpus fetch returned no body stream');
    const length = Number(res.headers.get('content-length'));
    return { body: res.body, contentLength: Number.isFinite(length) && length > 0 ? length : null };
  }

  /** gunzip a byte stream, or null when the browser lacks DecompressionStream. */
  function gunzip(byteStream) {
    if (typeof DecompressionStream !== 'function') return null;
    return byteStream.pipeThrough(new DecompressionStream('gzip'));
  }

  /**
   * Download a snapshot of exactly `maxBytes` (the manifest's
   * snapshot_bytes) into memory, calling onBytes(n) per chunk. A body that
   * would overflow is refused before it is buffered; a short one throws.
   * @param {string} url
   * @param {{signal: AbortSignal|undefined, maxBytes: number, onBytes: (n: number) => void}} opts
   * @returns {Promise<Uint8Array>}
   */
  async function readSnapshot(url, { signal, maxBytes, onBytes }) {
    const res = await request('snapshot fetch', url, { signal });
    if (!res.ok) throw httpError('snapshot fetch', res);
    if (!res.body) throw new Error('snapshot fetch returned no body stream');
    const out = new Uint8Array(maxBytes);
    const reader = res.body.getReader();
    let n = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (n + value.byteLength > maxBytes) {
        await reader.cancel();
        throw new Error(`snapshot is larger than its manifest's snapshot_bytes (${maxBytes}); the site published mismatched files`);
      }
      out.set(value, n);
      n += value.byteLength;
      onBytes(value.byteLength);
    }
    if (n !== maxBytes) throw new Error(`snapshot download ended at ${n} of ${maxBytes} bytes`);
    return out;
  }

  return { fetchMeta, openCorpus, gunzip, readSnapshot };
}
