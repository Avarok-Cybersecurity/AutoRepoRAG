// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-cache-cleanup.spec.js — a failed download leaves nothing behind.
//
// The corpus downloads into "<name>.jsonl.part" and is moved to its cache name
// only after the whole stream has parsed. On failure the partial is removed.
// Chromium releases a writable's lock asynchronously after abort(), so on a
// slow machine the removal can fail with NoModificationAllowedError (this is
// what made the corrupt-gzip test flaky in Linux CI: 8 of 60 runs). The
// removal now retries through that lag, and one that still fails is reported
// on the console instead of being swallowed. `lockLag` is the deterministic
// stand-in for the lag: removeEntry on this corpus's files fails with that
// exact error the first `times` calls.
// =============================================================================

import { test, expect } from '@playwright/test';
import { CORS_HEADERS } from './fixtures/openrouter.js';
import { CODE, GZ, GZ_HEADERS, JSON_HEADERS, META, acceptDownload, openChat, opfsFiles, routeCorpus, statusText } from './fixtures/chat-helpers.js';
import { startSlowServer } from './fixtures/slow-server.mjs';

const CORRUPT = Buffer.concat([GZ.subarray(0, 40), Buffer.alloc(200, 0x5a)]);

function lockLag(page, times) {
  return page.addInitScript((n) => {
    const remove = FileSystemDirectoryHandle.prototype.removeEntry;
    const left = new Map();
    FileSystemDirectoryHandle.prototype.removeEntry = function (name, options) {
      if (name.includes('~code@')) {
        const due = left.get(name) ?? n;
        if (due > 0) {
          left.set(name, due - 1);
          return Promise.reject(new DOMException('An attempt was made to modify an object where modifications are not allowed.', 'NoModificationAllowedError'));
        }
      }
      return remove.call(this, name, options);
    };
  }, times);
}

async function openCorrupt(page, context) {
  await context.route(CODE.metaUrl, (route) => route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(META) }));
  await context.route(CODE.gzUrl, (route) => route.fulfill({ status: 200, headers: GZ_HEADERS, body: CORRUPT }));
  await page.goto('/');
  await openChat(page);
  await acceptDownload(page);
  const card = page.locator('.cc-error[role="alert"]');
  await expect(card.locator('.cc-error-tag')).toHaveText(/unpack failed|download failed/, { timeout: 20_000 });
}

test('a removal that hits the lock-release lag is retried: no corpus file, no partial', async ({ page, context }) => {
  await lockLag(page, 3);
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await openCorrupt(page, context);
  expect(await opfsFiles(page)).toEqual([]);
  expect(errors.filter((t) => /cache/i.test(t))).toEqual([]);
});

test('a removal that keeps failing is reported, and never under the corpus name', async ({ page, context }) => {
  await lockLag(page, 1_000_000);
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await openCorrupt(page, context);
  // The partial could not be removed, but it is not under the name the cache
  // serves, and the failure is on the console rather than swallowed.
  expect(await opfsFiles(page)).toEqual([`arr-e2e-~code@${META.commit_sha}.jsonl.part`]);
  await expect.poll(() => errors.some((t) => t.includes('.jsonl.part') && t.includes('NoModificationAllowedError'))).toBe(true);
});

test('a download is written under the partial name and committed only when complete', async ({ page, context }) => {
  await routeCorpus(context);
  const slow = await startSlowServer(GZ, { chunkSize: 256, delayMs: 80 });
  await context.unroute(CODE.gzUrl);
  await context.route(CODE.gzUrl, (route) => route.fulfill({ status: 302, headers: { ...CORS_HEADERS, location: slow.url } }));
  try {
    await page.goto('/');
    await openChat(page);
    await acceptDownload(page);
    await expect(statusText(page)).toContainText('downloading corpus');
    // Mid-download: the partial exists (with Chromium's own .crswap beside
    // it); nothing is under the corpus name yet.
    const base = `arr-e2e-~code@${META.commit_sha}`;
    await expect.poll(() => opfsFiles(page)).toContain(`${base}.jsonl.part`);
    expect(await opfsFiles(page)).not.toContain(`${base}.jsonl`);
    await expect(statusText(page)).toContainText('ready ·', { timeout: 30_000 });
    expect(await opfsFiles(page)).toEqual([`arr-e2e-~code@${META.commit_sha}.jsonl`, `arr-e2e-~code@${META.commit_sha}.meta.json`]);
  } finally {
    await slow.close();
  }
});
