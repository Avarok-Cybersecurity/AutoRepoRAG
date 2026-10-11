// SPDX-License-Identifier: Apache-2.0
// The OPFS cache adapter (src/adapters/opfs.js) over an in-memory directory
// handle — the only stub is the browser's getDirectory().

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createOpfsCache } from '../../src/adapters/opfs.js';
import { corpusFileName, metaFileName } from '../../src/core/cache-names.js';

const SHA_OLD = '1'.repeat(40);
const SHA_NEW = '2'.repeat(40);

/** An in-memory FileSystemDirectoryHandle subset: name -> { text, lastModified }. */
function memoryDir(initial) {
  const files = new Map(Object.entries(initial));
  const removed = [];
  const fileOf = (name) => {
    const f = files.get(name);
    return { size: f.text.length, lastModified: f.lastModified, text: async () => f.text, stream: () => null };
  };
  const dir = {
    async *[Symbol.asyncIterator]() {
      for (const name of [...files.keys()]) yield [name, { kind: 'file', getFile: async () => fileOf(name) }];
    },
    async getFileHandle(name, opts = {}) {
      if (!files.has(name)) {
        if (!opts.create) throw Object.assign(new Error('NotFound'), { name: 'NotFoundError' });
        files.set(name, { text: '', lastModified: 0 });
      }
      return {
        getFile: async () => fileOf(name),
        createWritable: async () => {
          let buf = '';
          return {
            write: async (c) => {
              buf += c;
            },
            close: async () => files.set(name, { text: buf, lastModified: 99 }),
            abort: async () => undefined,
          };
        },
      };
    },
    async removeEntry(name) {
      removed.push(name);
      files.delete(name);
    },
  };
  return { files, removed, getDirectory: async () => dir };
}

const P = 'site-';
const metaText = (sha) => JSON.stringify({ commit_sha: sha });

describe('pruneStale', () => {
  it('a bad sha deletes nothing at all, rather than everything', async () => {
    for (const bad of [undefined, null, '', 0, {}, []]) {
      const mem = memoryDir({ [corpusFileName(P, 'code', SHA_OLD)]: { text: 'x', lastModified: 1 } });
      await createOpfsCache(P, mem).pruneStale('code', bad);
      assert.deepEqual(mem.removed, []);
    }
  });

  it("keeps the current commit's corpus and meta, drops the corpus's older ones, and never touches another corpus", async () => {
    const mem = memoryDir({
      [corpusFileName(P, 'code', SHA_OLD)]: { text: 'old', lastModified: 1 },
      [metaFileName(P, 'code', SHA_OLD)]: { text: metaText(SHA_OLD), lastModified: 1 },
      [corpusFileName(P, 'code', SHA_NEW)]: { text: 'new', lastModified: 2 },
      [metaFileName(P, 'code', SHA_NEW)]: { text: metaText(SHA_NEW), lastModified: 2 },
      [corpusFileName(P, 'docs', SHA_OLD)]: { text: 'docs', lastModified: 1 },
      [corpusFileName('other-', 'code', SHA_OLD)]: { text: 'theirs', lastModified: 1 },
      'unrelated.txt': { text: 'u', lastModified: 1 },
    });
    await createOpfsCache(P, mem).pruneStale('code', SHA_NEW);
    assert.deepEqual(mem.removed.sort(), [corpusFileName(P, 'code', SHA_OLD), metaFileName(P, 'code', SHA_OLD)].sort());
  });
});

describe('getCachedCorpus', () => {
  it('serves a hit, and treats a size mismatch with the manifest as a miss', async () => {
    const mem = memoryDir({ [corpusFileName(P, 'code', SHA_NEW)]: { text: 'abcd', lastModified: 1 } });
    const cache = createOpfsCache(P, mem);
    assert.equal((await cache.getCachedCorpus('code', SHA_NEW, 4)).size, 4);
    assert.equal(await cache.getCachedCorpus('code', SHA_NEW, 5), null);
    assert.equal(await cache.getCachedCorpus('code', SHA_OLD, 4), null);
  });

  it('degrades to "no cache" when the browser has no OPFS', async () => {
    const cache = createOpfsCache(P, { getDirectory: null });
    assert.equal(await cache.getCachedCorpus('code', SHA_NEW, 4), null);
    assert.equal(await cache.createCorpusWriter('code', SHA_NEW), null);
    assert.equal(await cache.newestOffline('code'), null);
  });
});

describe('newestOffline', () => {
  it('returns the newest corpus that still has its meta sidecar', async () => {
    const mem = memoryDir({
      [corpusFileName(P, 'code', SHA_OLD)]: { text: 'old', lastModified: 1 },
      [metaFileName(P, 'code', SHA_OLD)]: { text: metaText(SHA_OLD), lastModified: 1 },
      [corpusFileName(P, 'code', SHA_NEW)]: { text: 'newer, but its meta is gone', lastModified: 5 },
    });
    const off = await createOpfsCache(P, mem).newestOffline('code');
    assert.equal(off.sha, SHA_OLD);
    assert.deepEqual(off.rawMeta, { commit_sha: SHA_OLD });
  });

  it('a writer only publishes on finalize, and discard leaves nothing behind', async () => {
    const mem = memoryDir({});
    const cache = createOpfsCache(P, mem);
    const w = await cache.createCorpusWriter('code', SHA_NEW);
    await w.write('partial');
    await w.discard();
    assert.equal(mem.files.has(corpusFileName(P, 'code', SHA_NEW)), false);
    const w2 = await cache.createCorpusWriter('code', SHA_NEW);
    await w2.write('whole');
    await w2.finalize();
    await cache.writeMeta('code', SHA_NEW, { commit_sha: SHA_NEW });
    assert.equal(mem.files.get(corpusFileName(P, 'code', SHA_NEW)).text, 'whole');
    assert.equal((await cache.newestOffline('code')).sha, SHA_NEW);
  });
});
