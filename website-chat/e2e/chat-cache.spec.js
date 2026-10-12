// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-cache.spec.js — the OPFS corpus cache: a second visit reads the corpus
// locally, stale commits are pruned, an unreachable or invalid manifest falls
// back to the cached copy (offline badge), closing mid-download leaves nothing
// partial, and a failed download recovers on retry.
// =============================================================================

import { test, expect } from '@playwright/test';
import { CORS_HEADERS } from './fixtures/openrouter.js';
import {
  CODE,
  COMMIT,
  GZ,
  GZ_HEADERS,
  JSON_HEADERS,
  META,
  READY_LINE,
  cacheFile,
  cacheMeta,
  acceptDownload,
  openChat,
  opfsFiles,
  routeCorpus,
  statusText,
  waitReady,
} from './fixtures/chat-helpers.js';
import { startSlowServer } from './fixtures/slow-server.mjs';

/** Redirect the corpus URL to a local server that streams the gz slowly. */
async function routeSlowCorpus(context, hits, opts) {
  const slow = await startSlowServer(GZ, opts);
  await context.unroute(CODE.gzUrl);
  await context.route(CODE.gzUrl, async (route) => {
    hits.gz++;
    await route.fulfill({ status: 302, headers: { ...CORS_HEADERS, location: slow.url } });
  });
  return slow;
}

async function restoreFastCorpus(context, hits) {
  await context.unroute(CODE.gzUrl);
  await context.route(CODE.gzUrl, async (route) => {
    hits.gz++;
    await route.fulfill({ status: 200, headers: GZ_HEADERS, body: GZ });
  });
}

test('second visit serves the corpus from OPFS with only a manifest request, pruning stale commits', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  expect(hits).toEqual({ meta: 1, gz: 1 });
  await expect.poll(() => opfsFiles(page)).toEqual([cacheFile('code', COMMIT), cacheMeta('code', COMMIT)].sort());

  // Plant a stale commit of this corpus and another site's file; the next
  // load must prune the first and leave the second alone.
  const stale = cacheFile('code', '0'.repeat(40));
  const foreign = 'another-site-~code@' + '0'.repeat(40) + '.jsonl';
  await page.evaluate(async (names) => {
    const dir = await navigator.storage.getDirectory();
    for (const name of names) {
      const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
      await w.write('stale corpus');
      await w.close();
    }
  }, [stale, foreign]);

  await page.reload();
  await openChat(page);
  await waitReady(page);
  await expect(statusText(page)).toHaveText(READY_LINE);
  expect(hits).toEqual({ meta: 2, gz: 1 }); // corpus came from OPFS, not the network
  await expect.poll(() => opfsFiles(page)).toEqual([cacheFile('code', COMMIT), cacheMeta('code', COMMIT), foreign].sort());
});

test('manifest failure falls back to the cached corpus with the offline badge', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await context.unroute(CODE.metaUrl);
  await context.route(CODE.metaUrl, (route) => route.abort('failed'));

  await page.reload();
  await openChat(page);
  await waitReady(page);
  await expect(statusText(page)).toContainText('cached · offline');
  await expect(page.locator('.cc-log .cc-offline')).toBeVisible();
  expect(hits.gz).toBe(1); // never re-downloaded
});

test('an unreachable manifest with nothing cached shows the manifest card', async ({ page, context }) => {
  await context.route(CODE.metaUrl, (route) => route.abort('failed'));
  await page.goto('/');
  await openChat(page);
  const card = page.locator('.cc-error[role="alert"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('.cc-error-tag')).toHaveText('manifest unreachable');
});

// A manifest that PARSES but whose commit_sha is not a string used to pass
// validation on truthiness alone, become a cache filename and then silently
// disable pruning. It is a bad manifest now, which takes the offline path.
test('a manifest whose commit_sha is not a string is refused, not coerced', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await context.unroute(CODE.metaUrl);
  await context.route(CODE.metaUrl, async (route) => {
    await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify({ ...META, commit_sha: 12345 }) });
  });

  await page.reload();
  await openChat(page);
  await waitReady(page);
  await expect(statusText(page)).toContainText('cached · offline');
  expect(hits.gz).toBe(1); // and it did not re-download under a coerced name
  expect((await opfsFiles(page)).some((n) => n.includes('12345'))).toBe(false);
});

test('closing mid-download aborts cleanly and leaves no partial corpus', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  const slow = await routeSlowCorpus(context, hits, { chunkSize: 256, delayMs: 100 });
  try {
    await page.goto('/');
    const dialog = await openChat(page);
    await acceptDownload(page);
    await expect(statusText(page)).toContainText('downloading corpus');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // Nothing partial may remain in OPFS after the abort settles.
    await expect.poll(() => opfsFiles(page)).toEqual([]);

    // Reopening goes back through manifest + full download and succeeds.
    await restoreFastCorpus(context, hits);
    await openChat(page);
    await waitReady(page);
    await expect(statusText(page)).toHaveText(READY_LINE);
    expect(hits.meta).toBe(2);
    expect(hits.gz).toBe(2);
  } finally {
    await slow.close();
  }
});

// A 404 is the site's publishing, not a broken transfer: it gets the
// "corpus unavailable" card (see chat-faults.spec.js), and retry still works
// once the file is there.
test('corpus 404 shows the corpus-unavailable card and retry recovers', async ({ page, context }) => {
  const hits = { meta: 0, gz: 0 };
  await context.route(CODE.metaUrl, (route) => route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(META) }));
  await context.route(CODE.gzUrl, (route) => route.fulfill({ status: 404, headers: JSON_HEADERS, body: 'not found' }));
  await page.goto('/');
  await openChat(page);
  await acceptDownload(page);

  const card = page.locator('.cc-error[role="alert"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('.cc-error-tag')).toHaveText('corpus unavailable');
  expect(await opfsFiles(page)).toEqual([]);

  await restoreFastCorpus(context, hits);
  await card.locator('.cc-error-retry').click();
  await waitReady(page);
  await expect(statusText(page)).toHaveText(READY_LINE);
});

test('a corpus whose gzip is corrupt shows the unpack card and caches nothing', async ({ page, context }) => {
  await context.route(CODE.metaUrl, (route) => route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(META) }));
  const corrupt = Buffer.concat([GZ.subarray(0, 40), Buffer.alloc(200, 0x5a)]);
  await context.route(CODE.gzUrl, (route) => route.fulfill({ status: 200, headers: GZ_HEADERS, body: corrupt }));
  await page.goto('/');
  await openChat(page);
  await acceptDownload(page);
  const card = page.locator('.cc-error[role="alert"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('.cc-error-tag')).toHaveText(/unpack failed|download failed/);
  // The card shows only after cleanup, so the invariant holds at once, not
  // eventually: no corpus file and no partial download.
  expect(await opfsFiles(page)).toEqual([]);
});
