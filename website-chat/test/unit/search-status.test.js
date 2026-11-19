// SPDX-License-Identifier: Apache-2.0
// What search mode's status pill, announcer and result count say
// (src/core/search-status.js). Pure: (state snapshot, copy) -> text.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COPY_EN } from '../../src/copy-en.js';
import { resultsCountText, searchAnnounceText, searchStatusText } from '../../src/core/search-status.js';

const corpus = (id, kind, chunks) => ({ id, commit: 'abcdef1234567', chunks, plan: { kind, model: kind === 'bm25' ? null : 'm' } });
const base = { status: 'ready', progress: { loadedBytes: 0, totalBytes: 0, indexed: 0, totalPoints: 0 }, offline: false, searching: false };

describe('searchStatusText', () => {
  it('ready with one corpus: commit, chunks and how it is searched', () => {
    assert.equal(searchStatusText({ ...base, corpora: [corpus('site', 'bm25', 12)] }, COPY_EN), 'ready · abcdef1 · 12 chunks · keyword');
  });

  it('several corpora: their count, the chunk total and each way of searching once', () => {
    const chat = { ...base, offline: true, corpora: [corpus('a', 'bm25', 2), corpus('b', 'hybrid', 3), corpus('c', 'bm25', 1)] };
    assert.equal(searchStatusText(chat, COPY_EN), 'ready · 3 corpora · 6 chunks · keyword + hybrid · cached · offline');
  });

  it('while searching, and while loading, as answer mode words it', () => {
    assert.equal(searchStatusText({ ...base, searching: true, corpora: [corpus('a', 'bm25', 1)] }, COPY_EN), 'searching');
    assert.equal(searchStatusText({ ...base, status: 'downloading', corpora: [], progress: { loadedBytes: 500_000, totalBytes: 1_000_000, indexed: 0, totalPoints: 0 } }, COPY_EN), 'downloading corpus 0.5 of 1.0 MB');
  });

  it('the announcer never reads a running byte count', () => {
    assert.equal(searchAnnounceText({ ...base, status: 'downloading', corpora: [], progress: { loadedBytes: 1, totalBytes: 9, indexed: 0, totalPoints: 0 } }, COPY_EN), 'downloading corpus');
  });
});

describe('resultsCountText', () => {
  it('none, one and many', () => {
    assert.equal(resultsCountText({ query: 'zebra', items: [] }, COPY_EN), 'nothing matched “zebra”, try other words');
    assert.equal(resultsCountText({ query: 'plan', items: [{}] }, COPY_EN), '1 result for “plan”');
    assert.equal(resultsCountText({ query: 'plan', items: [{}, {}] }, COPY_EN), '2 results for “plan”');
  });
});
