// SPDX-License-Identifier: Apache-2.0
// What the status pill and loader say (src/core/status.js).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COPY_EN } from '../../src/copy-en.js';
import { loaderStages, progressPct, statusText } from '../../src/core/status.js';

const progress = (o = {}) => ({ loadedBytes: 0, totalBytes: 0, indexed: 0, totalPoints: 0, ...o });
const corpus = (id, commit, chunks) => ({ id, commit, chunks, dim: 8, files: 3, repo: 'o/r' });

describe('statusText', () => {
  it('one corpus: ready · short commit · chunks · dim', () => {
    const chat = { status: 'ready', corpora: [corpus('code', 'a3f9c1e7b2d8', 20)], offline: false, progress: progress() };
    assert.equal(statusText(chat, COPY_EN, false), 'ready · a3f9c1e · 20 chunks · dim 8');
  });

  it('several corpora: how many, and the chunks summed', () => {
    const chat = { status: 'ready', corpora: [corpus('code', 'a'.repeat(40), 20), corpus('docs', 'b'.repeat(40), 6)], offline: true, progress: progress() };
    assert.equal(statusText(chat, COPY_EN, false), 'ready · 2 corpora · 26 chunks · dim 8 · cached · offline');
  });

  it('download and indexing progress, and the asking phase', () => {
    const p = progress({ loadedBytes: 1048576, totalBytes: 3 * 1048576, indexed: 5, totalPoints: 20 });
    assert.equal(statusText({ status: 'downloading', corpora: [], progress: p }, COPY_EN, false), 'downloading corpus 1.0 of 3.0 MB');
    assert.equal(statusText({ status: 'indexing', corpora: [], progress: p }, COPY_EN, false), 'indexing 5 of 20');
    assert.equal(statusText({ status: 'ready', corpora: [], msgPhase: 'reranking', progress: p }, COPY_EN, true), 'reranking matches');
  });
});

describe('loader', () => {
  it('stages walk done/active/pending and the bar knows when it is determinate', () => {
    const chat = { status: 'downloading', progress: progress({ loadedBytes: 1, totalBytes: 4 }) };
    assert.deepEqual(loaderStages(chat, COPY_EN).map((s) => s.state), ['done', 'done', 'active', 'pending']);
    assert.equal(progressPct(chat), 25);
    assert.equal(progressPct({ status: 'manifest', progress: progress() }), null);
  });
});
