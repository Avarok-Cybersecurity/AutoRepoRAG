// SPDX-License-Identifier: Apache-2.0
// The snapshot download (src/adapters/corpus.js readSnapshot): exactly the
// manifest's snapshot_bytes, counted as they arrive; more is refused before
// it is buffered, less is an incomplete download. Only `fetch` is stubbed.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createCorpusNet } from '../../src/adapters/corpus.js';

/** A Response whose body arrives in the given chunks. */
const chunked = (chunks, init = {}) =>
  new Response(
    new ReadableStream({
      start(c) {
        for (const ch of chunks) c.enqueue(Uint8Array.from(ch));
        c.close();
      },
    }),
    init
  );

const netOf = (response) => createCorpusNet({ fetch: async () => response });

describe('readSnapshot', () => {
  it('returns the bytes and reports each chunk', async () => {
    const counts = [];
    const bytes = await netOf(chunked([[1, 2, 3], [4, 5]])).readSnapshot('https://c.test/s.lattice', { signal: undefined, maxBytes: 5, onBytes: (n) => counts.push(n) });
    assert.deepEqual([...bytes], [1, 2, 3, 4, 5]);
    assert.deepEqual(counts, [3, 2]);
  });

  it('a body larger than the manifest says is refused at the chunk that overflows', async () => {
    const counts = [];
    await assert.rejects(
      netOf(chunked([[1, 2, 3], [4, 5, 6]])).readSnapshot('https://c.test/s.lattice', { signal: undefined, maxBytes: 4, onBytes: (n) => counts.push(n) }),
      /larger than its manifest's snapshot_bytes \(4\)/
    );
    assert.deepEqual(counts, [3]);
  });

  it('a short body is an incomplete download', async () => {
    await assert.rejects(netOf(chunked([[1, 2]])).readSnapshot('https://c.test/s.lattice', { signal: undefined, maxBytes: 4, onBytes: () => {} }), /ended at 2 of 4 bytes/);
  });

  it('an HTTP error carries its status, no response is network', async () => {
    const http = await netOf(new Response('gone', { status: 404 }))
      .readSnapshot('https://c.test/s.lattice', { signal: undefined, maxBytes: 4, onBytes: () => {} })
      .catch((e) => e);
    assert.equal(http.status, 404);
    const offline = await createCorpusNet({ fetch: async () => Promise.reject(new TypeError('Failed to fetch')) })
      .readSnapshot('https://c.test/s.lattice', { signal: undefined, maxBytes: 4, onBytes: () => {} })
      .catch((e) => e);
    assert.equal(offline.network, true);
  });
});
