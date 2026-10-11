// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// corpus.js — the corpus network I/O: the tiny manifest preflight and the
// streamed .jsonl.gz download (fetch -> byte count -> DecompressionStream).
// =============================================================================

/** @param {{fetch: typeof fetch}} io */
export function createCorpusNet(io) {
  /** Fetch and parse a corpus meta.json. Throws on any HTTP or JSON failure. */
  async function fetchMeta(url) {
    const res = await io.fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`manifest fetch failed: HTTP ${res.status}`);
    return res.json();
  }

  /**
   * Start the gz download. Resolves { body, contentLength } (contentLength
   * null when the server sent none); throws on HTTP failure or no body.
   */
  async function openCorpus(url, signal) {
    const res = await io.fetch(url, { signal });
    if (!res.ok) throw new Error(`corpus fetch failed: HTTP ${res.status}`);
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
