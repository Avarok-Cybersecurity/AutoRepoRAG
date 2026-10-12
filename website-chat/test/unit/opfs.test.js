// SPDX-License-Identifier: Apache-2.0
// The OPFS cache adapter (src/adapters/opfs.js) over an in-memory directory
// handle — the only stub is the browser's getDirectory().

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createOpfsCache } from '../../src/adapters/opfs.js';
import { corpusFileName, metaFileName, partialFileName } from '../../src/core/cache-names.js';

const SHA_OLD = '1'.repeat(40);
const SHA_NEW = '2'.repeat(40);

/**
 * An in-memory FileSystemDirectoryHandle subset: name -> { text, lastModified }.
 * `lag[name] = n` makes the next n removeEntry/move calls on that name fail
 * with NoModificationAllowedError: the failure Chromium on Linux gives when
 * the write lock of a just-aborted (or just-closed) writable has not been
 * released yet (observed 8 times in 60 runs of the corrupt-gzip e2e test).
 * `failCreateWritable` makes createWritable throw after create:true has
 * already made the file.
 */
function memoryDir(initial, { lag = {}, failCreateWritable = false } = {}) {
  const files = new Map(Object.entries(initial));
  const removed = [];
  const sleeps = [];
  const domError = (name) => Object.assign(new Error(name), { name });
  const locked = (name) => {
    if ((lag[name] ?? 0) > 0) {
      lag[name]--;
      throw domError('NoModificationAllowedError');
    }
  };
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
        if (!opts.create) throw domError('NotFoundError');
        files.set(name, { text: '', lastModified: 0 });
      }
      const handle = {
        name,
        getFile: async () => fileOf(handle.name),
        move: async (to) => {
          locked(handle.name);
          files.set(to, files.get(handle.name));
          files.delete(handle.name);
          handle.name = to;
        },
        createWritable: async () => {
          if (failCreateWritable) throw domError('UnknownError');
          let buf = '';
          return {
            write: async (c) => {
              buf += c;
            },
            close: async () => files.set(handle.name, { text: buf, lastModified: 99 }),
            abort: async () => undefined,
          };
        },
      };
      return handle;
    },
    async removeEntry(name) {
      if (!files.has(name)) throw domError('NotFoundError');
      locked(name);
      removed.push(name);
      files.delete(name);
    },
  };
  return {
    files,
    removed,
    sleeps,
    getDirectory: async () => dir,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  };
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
    const cache = createOpfsCache(P, { getDirectory: null, sleep: async () => undefined });
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
    assert.deepEqual([...mem.files.keys()], []);
    const w2 = await cache.createCorpusWriter('code', SHA_NEW);
    await w2.write('whole');
    await w2.finalize();
    await cache.writeMeta('code', SHA_NEW, { commit_sha: SHA_NEW });
    assert.equal(mem.files.get(corpusFileName(P, 'code', SHA_NEW)).text, 'whole');
    assert.equal((await cache.newestOffline('code')).sha, SHA_NEW);
  });
});

// A download writes under a temporary name and is moved to the corpus name
// only once the whole stream has parsed, so a failure can never leave a file
// under the name the cache serves. Removal and the commit move retry through
// the lock-release lag, and a removal that still fails is thrown, not
// swallowed.
describe('corpus writer: atomic commit and cleanup', () => {
  it('writes under the .part name; the corpus name appears only at finalize', async () => {
    const mem = memoryDir({});
    const w = await createOpfsCache(P, mem).createCorpusWriter('code', SHA_NEW);
    await w.write('half');
    assert.deepEqual([...mem.files.keys()], [partialFileName(P, 'code', SHA_NEW)]);
    await w.write(' and half');
    await w.finalize();
    assert.deepEqual([...mem.files.keys()], [corpusFileName(P, 'code', SHA_NEW)]);
    assert.equal(mem.files.get(corpusFileName(P, 'code', SHA_NEW)).text, 'half and half');
  });

  it('discard retries a removal that hits the lock-release lag, and the partial is gone', async () => {
    const mem = memoryDir({}, { lag: { [partialFileName(P, 'code', SHA_NEW)]: 3 } });
    const w = await createOpfsCache(P, mem).createCorpusWriter('code', SHA_NEW);
    await w.write('partial');
    await w.discard();
    assert.deepEqual([...mem.files.keys()], []);
    assert.equal(mem.sleeps.length, 3);
  });

  it('a removal that keeps failing is thrown with the file name, never swallowed', async () => {
    const name = partialFileName(P, 'code', SHA_NEW);
    const mem = memoryDir({}, { lag: { [name]: 1000 } });
    const w = await createOpfsCache(P, mem).createCorpusWriter('code', SHA_NEW);
    await w.write('partial');
    await assert.rejects(w.discard(), (e) => e.name === 'CacheCleanupError' && e.message.includes(name) && e.cause?.name === 'NoModificationAllowedError');
  });

  it('finalize retries the commit move through the same lag', async () => {
    const mem = memoryDir({}, { lag: { [partialFileName(P, 'code', SHA_NEW)]: 2 } });
    const w = await createOpfsCache(P, mem).createCorpusWriter('code', SHA_NEW);
    await w.write('whole');
    await w.finalize();
    assert.deepEqual([...mem.files.keys()], [corpusFileName(P, 'code', SHA_NEW)]);
  });

  it('a createWritable failure removes the file create:true made, and degrades to no cache', async () => {
    const mem = memoryDir({}, { failCreateWritable: true });
    assert.equal(await createOpfsCache(P, mem).createCorpusWriter('code', SHA_NEW), null);
    assert.deepEqual([...mem.files.keys()], []);
  });

  it('pruneStale also sweeps partial downloads of the corpus, and reports what it could not remove', async () => {
    const stuck = partialFileName(P, 'code', SHA_OLD);
    const mem = memoryDir(
      {
        [corpusFileName(P, 'code', SHA_NEW)]: { text: 'new', lastModified: 2 },
        [partialFileName(P, 'code', SHA_NEW)]: { text: 'stray', lastModified: 2 },
        [stuck]: { text: 'stray', lastModified: 1 },
        [partialFileName(P, 'docs', SHA_OLD)]: { text: 'not ours', lastModified: 1 },
      },
      { lag: { [stuck]: 1000 } }
    );
    await assert.rejects(createOpfsCache(P, mem).pruneStale('code', SHA_NEW), (e) => e.name === 'CacheCleanupError' && e.message.includes(stuck));
    assert.deepEqual([...mem.files.keys()].sort(), [corpusFileName(P, 'code', SHA_NEW), stuck, partialFileName(P, 'docs', SHA_OLD)].sort());
  });
});
