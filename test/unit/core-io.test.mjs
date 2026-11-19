// core-io.test.mjs — the core reaches files and URLs only through the io
// port, so these tests run it on in-memory data with no disk or network.
//
// Fakes, justified: each is a plain object of the port's shape holding the
// exact bytes a test needs. The node adapter (src/adapters/node-io.mjs) is
// exercised end to end by the integration suite and by embed-providers.test.mjs;
// here the fake is what lets a test name a file that is listed but missing,
// or a meta.json from another model, without building that state on disk.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildChunks, chunkerFor } from '../../src/chunk.mjs';
import { installLogSink } from '../../src/log.mjs';
import { serializeCorpus } from '../../src/jsonl.mjs';
import { loadPreviousCorpus } from '../../src/vectors.mjs';

// The log facade's sink is a test input like any other: the lines land here.
const logged = [];
installLogSink((text) => logged.push(text));

/** An in-memory io.listFiles + io.fs over `files` ({path: string|Buffer}); `listed` may name absent paths. */
function memoryFiles(files, listed = Object.keys(files)) {
  const at = (abs) => abs.replace(/^\/root\//, '');
  return {
    listFiles: (root, listing) => {
      assert.equal(root, '/root');
      assert.equal(listing, 'walk');
      return listed;
    },
    fs: {
      exists: (abs) => Object.hasOwn(files, at(abs)),
      readBytes: (abs) => Buffer.from(files[at(abs)]),
    },
  };
}

const chunkOpts = (o = {}) => ({
  root: '/root', includeGlobs: ['**'], excludeGlobs: [], listing: 'walk', maxChunks: 0, repo: 'o/r', commitSha: 'c'.repeat(40),
  chunkFile: chunkerFor('lines', { chunkLines: 10, chunkOverlap: 0, maxChunkBytes: 1000 }), ...o,
});

describe('buildChunks through the io port', () => {
  it('chunks the listed text files in path order and reads nothing else', () => {
    const { chunks, fileCount, matchedFiles } = buildChunks(chunkOpts(), memoryFiles({ 'b.md': 'bee\n', 'a.md': 'ay\n' }));
    assert.deepEqual(chunks.map((c) => [c.id, c.path, c.payload.text]), [[1, 'a.md', 'ay'], [2, 'b.md', 'bee']]);
    assert.equal(fileCount, 2);
    assert.equal(matchedFiles, 2);
  });

  it('skips a binary file and a listed file missing from the tree', () => {
    const io = memoryFiles({ 'a.md': 'ay\n', 'img.png': Buffer.from([0x89, 0, 1]) }, ['a.md', 'img.png', 'gone.md']);
    const { chunks, skippedBinary } = buildChunks(chunkOpts(), io);
    assert.deepEqual(chunks.map((c) => c.path), ['a.md']);
    assert.deepEqual(skippedBinary, ['img.png']);
    assert.ok(logged.includes('::warning::skipping gone.md: tracked but missing from the worktree\n'), logged.join(''));
  });

  it('applies the include and exclude globs to the listing', () => {
    const io = memoryFiles({ 'a.md': 'ay\n', 'a.txt': 'tee\n', 'drafts/x.md': 'x\n' });
    const { chunks } = buildChunks(chunkOpts({ includeGlobs: ['**/*.md'], excludeGlobs: ['drafts/**'] }), io);
    assert.deepEqual(chunks.map((c) => c.path), ['a.md']);
  });
});

describe('loadPreviousCorpus through the io port', () => {
  const corpus = serializeCorpus({
    collectionName: 'c', dim: 2, points: [{ id: 1, vector: [0.6, 0.8], payload: { chunk_hash: 'h1', text: 't' } }],
  });
  /** An in-memory io.readUrl over `urls` ({url: string}). */
  const memoryUrls = (urls) => ({
    readUrl: async (url) => {
      if (!Object.hasOwn(urls, url)) throw new Error(`HTTP 404 for ${url}`);
      return Buffer.from(urls[url]);
    },
  });

  it('indexes reusable vectors by chunk_hash when the model matches', async () => {
    const io = memoryUrls({ 'u:corpus': corpus, 'u:meta': JSON.stringify({ model: 'm' }) });
    const prev = await loadPreviousCorpus('u:corpus', 'u:meta', 'm', null, io);
    assert.equal(prev.dim, 2);
    assert.deepEqual(prev.byHash.get('h1'), [0.6, 0.8]);
  });

  it('discards a corpus another model produced', async () => {
    const io = memoryUrls({ 'u:corpus': corpus, 'u:meta': JSON.stringify({ model: 'other' }) });
    assert.equal(await loadPreviousCorpus('u:corpus', 'u:meta', 'm', null, io), null);
    assert.ok(logged.includes('::warning::previous corpus discarded: model "other" != current "m"\n'), logged.join(''));
  });

  it('discards an unreadable corpus instead of failing the run', async () => {
    assert.equal(await loadPreviousCorpus('u:corpus', 'u:meta', 'm', null, memoryUrls({})), null);
  });
});
