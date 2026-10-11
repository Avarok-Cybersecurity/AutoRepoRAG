// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// corpus.js — the corpus network I/O: the tiny manifest preflight and the
// streamed .jsonl.gz download (fetch -> byte count -> DecompressionStream).
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

  return { fetchMeta, openCorpus, gunzip };
}
