// SPDX-License-Identifier: Apache-2.0
// What the download consent step asks for (src/core/consent.js): only the
// corpora with no cached copy, plus the engine when it still has to be
// fetched, sized for a person to read.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COPY_EN } from '../../src/copy-en.js';
import { formatSize, missingDownload } from '../../src/core/consent.js';
import { announceText } from '../../src/core/status.js';

const planItem = (id, gzBytes, cached) => ({ corpus: { id }, meta: { gzBytes }, file: cached ? { size: 1 } : null });

describe('missingDownload', () => {
  it('lists only uncached corpora, in config order, and sums them with the engine', () => {
    const plan = [planItem('code', 120_000_000, false), planItem('docs', 15_000_000, true), planItem('book', 12_000_000, false)];
    assert.deepEqual(missingDownload(plan, 760_000), {
      corpora: [
        { id: 'code', bytes: 120_000_000 },
        { id: 'book', bytes: 12_000_000 },
      ],
      wasmBytes: 760_000,
      totalBytes: 132_760_000,
    });
  });

  it('nothing missing: no question at all, whatever the engine', () => {
    assert.equal(missingDownload([planItem('code', 5, true)], 760_000), null);
  });

  it('a cached (0) or unknown (null) engine adds nothing', () => {
    assert.equal(missingDownload([planItem('code', 5, false)], 0).totalBytes, 5);
    assert.equal(missingDownload([planItem('code', 5, false)], null).totalBytes, 5);
  });
});

describe('formatSize', () => {
  it('KB below a megabyte, MB from there, one decimal', () => {
    assert.equal(formatSize(5741, COPY_EN), '5.6 KB');
    assert.equal(formatSize(1048576, COPY_EN), '1.0 MB');
    assert.equal(formatSize(127_708_000, COPY_EN), '121.8 MB');
  });
});

describe('announceText while asking for consent', () => {
  it('names the step, not the size (the focused button carries the size, once)', () => {
    const chat = { status: 'consent', corpora: [], progress: {}, consent: { corpora: [{ id: 'code', bytes: 5741 }], wasmBytes: null, totalBytes: 5741 } };
    assert.equal(announceText(chat, COPY_EN, false), COPY_EN.status.consent);
    assert.doesNotMatch(announceText(chat, COPY_EN, false), /KB|MB/);
  });
});
