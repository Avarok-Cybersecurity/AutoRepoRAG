// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// search.spec.js — search mode (config.mode 'search') end to end, against the
// fixture snapshots and the released lattice-db v0.5.0 wasm: the consent step
// sizes the snapshot, the snapshot is checksummed, installed and cached, a
// query lists ranked results (title link, heading breadcrumb, marked
// snippet) with no key UI and no OpenRouter call, payload urls that are not
// http(s) get no link, the arrow keys walk the list, two corpora (one hybrid,
// with the site's embedder) merge into one list, and a corpus that cannot be
// searched fails with the reason. Desktop and the 390x844 phone sheet.
// =============================================================================

import { test, expect } from '@playwright/test';
import { seriousViolations } from './fixtures/axe.js';
import {
  GUIDE,
  SITE,
  forbidOpenRouter,
  hits,
  input,
  openSearch,
  opfsFiles,
  routeSnapshot,
  search,
  snapshotFile,
  snapshotMeta,
  statusText,
  waitReady,
} from './fixtures/search-helpers.js';

const SHORT = SITE.commit.slice(0, 7);

test('a first open asks for the snapshot, then a query lists linked results with breadcrumbs, and nothing calls a model', async ({ page, context }) => {
  const served = await routeSnapshot(context);
  const openrouter = await forbidOpenRouter(context);
  await page.goto('/search');
  await openSearch(page);

  const panel = page.locator('.cc-consent');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel.locator('.cc-consent-corpus .cc-consent-name')).toHaveText(['site']);
  await expect(panel.locator('.cc-consent-total')).toContainText(`${(SITE.meta.snapshot_bytes / 1000).toFixed(1)} KB kept in this browser`);
  expect(served).toEqual({ meta: 1, snapshot: 0 });

  await page.locator('.cc-consent-accept').click();
  await expect(statusText(page)).toHaveText(`ready · ${SHORT} · ${SITE.meta.points} chunks · keyword`, { timeout: 30_000 });
  await expect(input(page)).toBeFocused();
  await expect(page.locator('.cc-keyrow, .cc-key-input')).toHaveCount(0);

  await search(page, 'support team');
  await expect(page.locator('.cs-count')).toHaveText(/^\d+ results? for “support team”$/);
  const first = hits(page).first();
  await expect(first.locator('a.cs-hit-title')).toHaveText('About us');
  await expect(first.locator('a.cs-hit-title')).toHaveAttribute('href', 'https://site.test/about/');
  await expect(first.locator('.cs-crumb')).toHaveText(['About', 'Contact']);
  await expect(first.locator('.cs-snippet')).toContainText('Write to the support team at help@site.test');
  await expect(first.locator('.cs-snippet mark')).toHaveText(['support', 'team']);
  await expect(first.locator('.cs-corpus')).toHaveCount(0);

  expect(served.snapshot).toBe(1);
  expect(openrouter).toEqual([]);
  expect(await page.evaluate(() => window.__events)).toEqual(['ready']);
});

test('the snapshot is cached under its commit: a reload opens without asking or downloading', async ({ page, context }) => {
  const served = await routeSnapshot(context);
  await page.goto('/search');
  await openSearch(page);
  await waitReady(page);
  await expect.poll(() => opfsFiles(page)).toEqual([snapshotFile('site', SITE.commit), snapshotMeta('site', SITE.commit)].sort());

  await page.reload();
  await openSearch(page);
  await expect(statusText(page)).toContainText('ready ·', { timeout: 30_000 });
  await expect(page.locator('.cc-consent')).toHaveCount(0);
  expect(served).toEqual({ meta: 2, snapshot: 1 });
  await search(page, 'docker');
  await expect(hits(page).first().locator('.cs-hit-title')).toHaveText('Install');
});

test('a payload url that is not http(s) is shown as text, never as a link', async ({ page, context }) => {
  await routeSnapshot(context);
  await page.goto('/search');
  await openSearch(page);
  await waitReady(page);
  await search(page, 'legal notice registration');
  const legal = hits(page).filter({ hasText: 'Legal notice' });
  await expect(legal).toHaveCount(1);
  await expect(legal.locator('span.cs-hit-title')).toHaveText('Legal notice');
  await expect(legal.locator('a')).toHaveCount(0);
  await expect(page.locator('.cc a[href^="javascript:"]')).toHaveCount(0);
});

test('keyboard: Down from the field walks the result links, Up from the first returns to the field', async ({ page, context }) => {
  await routeSnapshot(context);
  await page.goto('/search');
  await openSearch(page);
  await waitReady(page);
  await search(page, 'plan support');
  const links = page.locator('a.cs-hit-title');
  expect(await links.count()).toBeGreaterThan(1);

  await input(page).press('ArrowDown');
  await expect(links.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(input(page)).toBeFocused();
  expect(await seriousViolations(page)).toEqual([]);
});

test('no match says so, and the results fit the phone sheet without sideways scroll', async ({ page, context }) => {
  await routeSnapshot(context);
  await page.goto('/search');
  await openSearch(page);
  await waitReady(page);
  await search(page, 'zeppelin');
  await expect(page.locator('.cs-count')).toHaveText('nothing matched “zeppelin”, try other words');

  await search(page, 'pro plan billed monthly');
  const overflow = await page.locator('.cs-log').evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await hits(page).first().boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
});

test('two corpora, one hybrid with the site embedder: one list, ranked across both', async ({ page, context }) => {
  await routeSnapshot(context, SITE);
  await routeSnapshot(context, GUIDE);
  await page.goto('/search?corpora=site,guide&embedder=1');
  await openSearch(page);
  await waitReady(page);
  await expect(statusText(page)).toHaveText(`ready · 2 corpora · ${SITE.meta.points + GUIDE.meta.points} chunks · keyword + hybrid`);

  await search(page, 'priority support');
  await expect(hits(page)).toHaveCount(5);
  const corpora = await hits(page).locator('.cs-corpus').allTextContents();
  expect(new Set(corpora)).toEqual(new Set(['site', 'guide']));
  const embedded = await page.evaluate(() => window.__embedCalls);
  expect(embedded).toContainEqual(['priority support']);
});

test('a corpus published without a snapshot fails with the reason, before any download', async ({ page, context }) => {
  const served = await routeSnapshot(context, SITE, { meta: { ...SITE.meta, snapshot_bytes: null, snapshot_sha256: null, snapshot_format: null } });
  await page.goto('/search');
  await openSearch(page);
  const card = page.locator('.cc-error[role="alert"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('.cc-error-tag')).toHaveText('corpus mismatch');
  await expect(card.locator('.cc-error-body')).toContainText('"site" was published without a snapshot');
  expect(served.snapshot).toBe(0);
});

test('a snapshot that does not match its checksum is refused and nothing is kept', async ({ page, context }) => {
  const tampered = Buffer.from(SITE.bytes);
  tampered[tampered.length - 1] ^= 1;
  await routeSnapshot(context, SITE, { bytes: tampered });
  await page.goto('/search');
  await openSearch(page);
  await page.locator('.cc-consent-accept').click({ timeout: 30_000 });
  const card = page.locator('.cc-error[role="alert"]');
  await expect(card.locator('.cc-error-tag')).toHaveText('download failed', { timeout: 20_000 });
  expect(await opfsFiles(page)).toEqual([]);
});
