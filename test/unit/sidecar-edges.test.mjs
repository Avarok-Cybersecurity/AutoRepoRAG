// sidecar-edges.test.mjs — payload-sidecar merge and edges-file resolution (pure).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { mergeSidecar } from '../../src/sidecar.mjs';
import { resolveEdges } from '../../src/edges.mjs';

/** Chunks as buildChunks returns them: ids ascend in (path, ordinal) order. */
function chunksOf(spec) {
  const out = [];
  for (const [path, n] of spec) {
    for (let ordinal = 0; ordinal < n; ordinal++) {
      out.push({ id: out.length + 1, path, ordinal, chunkHash: `h${out.length}`, payload: { path, text: `${path}#${ordinal}` } });
    }
  }
  return out;
}

describe('mergeSidecar', () => {
  const chunks = chunksOf([['about/index.md', 2], ['index.md', 1]]);

  it('merges each file entry into every chunk of that file', () => {
    const merged = mergeSidecar(chunks, {
      'about/index.md': { url: 'https://s/about/', title: 'About', lastmod: '2026-11-01' },
      'index.md': { url: 'https://s/', title: 'Home' },
    });
    assert.deepEqual(merged.map((c) => c.payload.url), ['https://s/about/', 'https://s/about/', 'https://s/']);
    assert.equal(merged[0].payload.text, 'about/index.md#0');
    assert.equal(merged[2].payload.lastmod, undefined);
    assert.equal(chunks[0].payload.url, undefined, 'input chunks are not mutated');
  });

  it('files without an entry keep their payload unchanged', () => {
    const merged = mergeSidecar(chunks, { 'index.md': { title: 'Home' } });
    assert.deepEqual(merged[0].payload, chunks[0].payload);
  });

  it('an entry for a file not in the corpus fails naming it', () => {
    assert.throws(
      () => mergeSidecar(chunks, { 'index.md': {}, 'missing/index.md': { url: 'x' } }),
      { message: /^payload-sidecar names 1 file\(s\) not in the corpus: "missing\/index\.md"/ },
    );
  });

  it('refuses to overwrite a field the action writes', () => {
    for (const key of ['text', 'path', 'chunk_hash', 'heading_path', 'start_line']) {
      assert.throws(
        () => mergeSidecar(chunks, { 'index.md': { [key]: 'x' } }),
        { message: new RegExp(`payload-sidecar\\["index\\.md"\\]\\.${key} would overwrite`) },
      );
    }
  });

  for (const [label, bad, re] of [
    ['an array', [], /payload-sidecar must be a JSON object/],
    ['null', null, /payload-sidecar must be a JSON object/],
    ['a non-object entry', { 'index.md': 'Home' }, /payload-sidecar\["index\.md"\] must be a JSON object/],
    ['an array entry', { 'index.md': [1] }, /payload-sidecar\["index\.md"\] must be a JSON object/],
  ]) {
    it(`rejects ${label}`, () => assert.throws(() => mergeSidecar(chunks, bad), { message: re }));
  }
});

describe('resolveEdges', () => {
  const chunks = chunksOf([['a.md', 3], ['b.md', 1], ['c.md', 2]]);

  it('adds automatic "next" edges between consecutive chunks of a file', () => {
    const { edges, relations } = resolveEdges(chunks, [], { nextEdges: true });
    assert.deepEqual(edges, [
      { from: 1, to: 2, rel: 'next', w: 1 },
      { from: 2, to: 3, rel: 'next', w: 1 },
      { from: 5, to: 6, rel: 'next', w: 1 },
    ]);
    assert.deepEqual(relations, { next: 0 });
  });

  it('no next edges when disabled and no file edges: empty', () => {
    assert.deepEqual(resolveEdges(chunks, [], { nextEdges: false }), { edges: [], relations: {} });
  });

  it('resolves path (+ optional chunk index, default 0) to point ids, sorted (from, rel, to)', () => {
    const spec = [
      { from: { path: 'c.md', chunk: 1 }, to: { path: 'a.md' }, relation: 'links_to', weight: 0.5 },
      { from: { path: 'a.md', chunk: 2 }, to: { path: 'b.md' }, relation: 'cites', weight: 2 },
      { from: { path: 'a.md', chunk: 2 }, to: { path: 'c.md' }, relation: 'cites', weight: 1 },
    ];
    const { edges, relations } = resolveEdges(chunks, spec, { nextEdges: true });
    assert.deepEqual(edges, [
      { from: 1, to: 2, rel: 'next', w: 1 },
      { from: 2, to: 3, rel: 'next', w: 1 },
      { from: 3, to: 4, rel: 'cites', w: 2 },
      { from: 3, to: 5, rel: 'cites', w: 1 },
      { from: 5, to: 6, rel: 'next', w: 1 },
      { from: 6, to: 1, rel: 'links_to', w: 0.5 },
    ]);
    assert.deepEqual(relations, { next: 0, cites: 1, links_to: 2 });
  });

  for (const [label, edge, re] of [
    ['an unknown path', { from: { path: 'zz.md' }, to: { path: 'a.md' }, relation: 'r', weight: 1 }, /edges-file\[0\]\.from\.path "zz\.md" is not in the corpus/],
    ['a chunk index past the end', { from: { path: 'b.md', chunk: 1 }, to: { path: 'a.md' }, relation: 'r', weight: 1 }, /edges-file\[0\]\.from\.chunk 1 is out of range: "b\.md" has 1 chunk\(s\)/],
    ['a negative chunk', { from: { path: 'a.md' }, to: { path: 'b.md', chunk: -1 }, relation: 'r', weight: 1 }, /edges-file\[0\]\.to\.chunk must be an integer >= 0/],
    ['a missing relation', { from: { path: 'a.md' }, to: { path: 'b.md' }, weight: 1 }, /edges-file\[0\]\.relation must match/],
    ['a relation with spaces', { from: { path: 'a.md' }, to: { path: 'b.md' }, relation: 'links to', weight: 1 }, /edges-file\[0\]\.relation must match/],
    ['a non-finite weight', { from: { path: 'a.md' }, to: { path: 'b.md' }, relation: 'r', weight: '1' }, /edges-file\[0\]\.weight must be a finite number/],
    ['a self-loop', { from: { path: 'b.md' }, to: { path: 'b.md' }, relation: 'r', weight: 1 }, /edges-file\[0\] is a self-loop on point 4/],
    ['a non-object endpoint', { from: 'a.md', to: { path: 'b.md' }, relation: 'r', weight: 1 }, /edges-file\[0\]\.from must be \{path, chunk\?\}/],
  ]) {
    it(`fails on ${label}`, () => assert.throws(() => resolveEdges(chunks, [edge], { nextEdges: false }), { message: re }));
  }

  it('rejects a non-array edges file', () => {
    assert.throws(() => resolveEdges(chunks, { edges: [] }, { nextEdges: false }), { message: /edges-file must be a JSON array/ });
  });

  it('rejects a duplicate (from, to, relation), naming both sources', () => {
    const e = { from: { path: 'a.md' }, to: { path: 'b.md' }, relation: 'r', weight: 1 };
    assert.throws(() => resolveEdges(chunks, [e, e], { nextEdges: false }), { message: /edges-file\[1\] duplicates edges-file\[0\]/ });
    const clash = { from: { path: 'a.md', chunk: 0 }, to: { path: 'a.md', chunk: 1 }, relation: 'next', weight: 1 };
    assert.throws(() => resolveEdges(chunks, [clash], { nextEdges: true }), { message: /edges-file\[0\] duplicates the automatic "next" edge/ });
  });
});
