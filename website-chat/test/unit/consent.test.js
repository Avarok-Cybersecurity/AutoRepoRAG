// SPDX-License-Identifier: Apache-2.0
// What the download consent step asks for (src/core/consent.js): only the
// corpora with no cached copy, plus the engine when it still has to be
// fetched, sized for a person to read.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COPY_EN } from '../../src/copy-en.js';
import { formatSize, missingDownload } from '../../src/core/consent.js';
import { announceText } from '../../src/core/status.js';

const planItem = (id, gzBytes, cached, bytes = gzBytes * 3) => ({ corpus: { id }, meta: { gzBytes, bytes }, file: cached ? { size: 1 } : null });

describe('missingDownload', () => {
  it('lists only uncached corpora, in config order, and sums them with the engine', () => {
    const plan = [planItem('code', 120_000_000, false, 350_000_000), planItem('docs', 15_000_000, true), planItem('book', 12_000_000, false, 37_000_000)];
    assert.deepEqual(missingDownload(plan, 760_000), {
      corpora: [
        { id: 'code', bytes: 120_000_000 },
        { id: 'book', bytes: 12_000_000 },
      ],
      wasmBytes: 760_000,
      totalBytes: 132_760_000,
      // What stays in the browser: the decompressed corpora (meta `bytes`).
      storedBytes: 387_000_000,
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
  // Decimal SI, as downloads and the site report sizes: 134,217,728 bytes is
  // "134.2 MB", never the MiB figure "128.0 MB" under an MB label.
  it('decimal KB below a megabyte, decimal MB from there, one decimal', () => {
    assert.equal(formatSize(5741, COPY_EN), '5.7 KB');
    assert.equal(formatSize(1_000_000, COPY_EN), '1.0 MB');
    assert.equal(formatSize(134_217_728, COPY_EN), '134.2 MB');
    assert.equal(formatSize(999_949, COPY_EN), '999.9 KB');
  });
});

describe('announceText while asking for consent', () => {
  it('names the step, not the size (the focused consent region carries the size, once)', () => {
    const chat = { status: 'consent', corpora: [], progress: {}, consent: { corpora: [{ id: 'code', bytes: 5741 }], wasmBytes: null, totalBytes: 5741 } };
    assert.equal(announceText(chat, COPY_EN, false), COPY_EN.status.consent);
    assert.doesNotMatch(announceText(chat, COPY_EN, false), /KB|MB/);
  });
});
