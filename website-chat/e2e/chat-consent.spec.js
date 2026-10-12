// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-consent.spec.js — the first open asks before it downloads. Only the
// small meta.json files are fetched to size the download; the dialog then
// shows the size and the corpus names with "download <size>" and "not now".
// No .jsonl.gz is requested before the button is pressed. "not now" closes
// cleanly and leaves nothing behind; a cached open never asks; a partly cached
// set asks only for what is missing. Desktop and the 390x844 phone sheet.
// =============================================================================

import { test, expect } from '@playwright/test';
import { seriousViolations } from './fixtures/axe.js';
import { DOCS, dialogOf, gapBetween, opfsFiles, openChat, routeCorpus, statusText } from './fixtures/chat-helpers.js';

const SIZE = /^\d+\.\d (KB|MB)$/;
const panel = (page) => page.locator('.cc-consent');
const accept = (page) => page.locator('.cc-consent-accept');

test('a first open asks before any corpus download, with the size and the corpus names', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  await page.goto('/');
  await openChat(page);

  await expect(panel(page)).toBeVisible();
  // Focus lands on the question (announced with its sizes), and the action is one Tab away.
  await expect(panel(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(accept(page)).toBeFocused();
  await expect(accept(page)).toHaveText(/^download \d+\.\d (KB|MB)$/);
  // What stays on the device is stated too: the decompressed corpus (meta bytes), decimal units.
  await expect(panel(page).locator('.cc-consent-total')).toContainText('14.9 KB kept in this browser');
  await expect(panel(page).locator('.cc-consent-corpus .cc-consent-name')).toHaveText(['code']);
  await expect(panel(page).locator('.cc-consent-corpus .cc-consent-size')).toHaveText([SIZE]);

  // Waiting does not start it: the manifest was read, the corpus was not.
  await page.waitForTimeout(1500);
  expect(hits).toEqual({ meta: 1, gz: 0 });
  expect(await opfsFiles(page)).toEqual([]);

  await accept(page).click();
  await expect(statusText(page)).toContainText('ready ·', { timeout: 30_000 });
  expect(hits.gz).toBe(1);
});

test('"not now" closes cleanly, keeps nothing, and the next open asks again', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await expect(accept(page)).toBeVisible();

  await page.locator('.cc-consent-decline').click();
  await expect(dialogOf(page)).toBeHidden();
  await expect(page.locator('.open-chat')).toBeFocused();
  expect(await page.evaluate(() => window.__events)).toContain('close');
  expect(await page.evaluate(() => window.__handle.ready.then(() => 'resolved', (e) => e.message))).toBe('the chat was closed before its corpora were ready');
  await page.waitForTimeout(500);
  expect(hits.gz).toBe(0);
  expect(await opfsFiles(page)).toEqual([]);

  await openChat(page);
  await expect(accept(page)).toBeVisible();
  expect(hits.gz).toBe(0);
});

test('a cached open starts without asking', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await accept(page).click();
  await expect(statusText(page)).toContainText('ready ·', { timeout: 30_000 });

  await page.reload();
  // Remember whether the consent panel ever appears during the second open.
  await page.evaluate(() => {
    window.__askedAgain = false;
    new MutationObserver(() => {
      if (document.querySelector('.cc-consent')) window.__askedAgain = true;
    }).observe(document.body, { subtree: true, childList: true });
  });
  await openChat(page);
  await expect(statusText(page)).toContainText('ready ·', { timeout: 30_000 });
  expect(await page.evaluate(() => window.__askedAgain)).toBe(false);
  expect(hits.gz).toBe(1);
});

test('a partly cached set asks only for the corpus that is missing', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  const docsHits = await routeCorpus(context, DOCS);
  await page.goto('/?corpora=code');
  await openChat(page);
  await accept(page).click();
  await expect(statusText(page)).toContainText('ready ·', { timeout: 30_000 });

  await page.goto('/?corpora=code,docs');
  await openChat(page);
  await expect(panel(page).locator('.cc-consent-corpus .cc-consent-name')).toHaveText(['docs']);
  await accept(page).click();
  await expect(statusText(page)).toContainText('ready · 2 corpora', { timeout: 30_000 });
  expect(hits.gz).toBe(1);
  expect(docsHits.gz).toBe(1);
});

test('the consent step is axe-clean, says the size once, keeps its actions apart and fits the viewport', async ({ page, context }) => {
  await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await expect(panel(page)).toBeFocused();

  expect(await seriousViolations(page)).toEqual([]);
  // The focused region is named by its question and described by the sizes,
  // so the size is read before the action; no live region repeats it.
  const described = await panel(page).evaluate((el) =>
    (el.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
  );
  expect(described).toMatch(/\d+\.\d (KB|MB) to download/);
  await expect(panel(page)).toHaveAttribute('aria-labelledby', /\S/);
  const live = await page.locator('.cc [aria-live], .cc [role="status"], .cc [role="alert"]').allTextContents();
  expect(live.filter((t) => /\d (KB|MB)/.test(t))).toEqual([]);

  expect(await gapBetween(accept(page), page.locator('.cc-consent-decline'))).toBeGreaterThanOrEqual(24);
  const width = page.viewportSize().width;
  for (const sel of ['.cc-consent', '.cc-consent-accept', '.cc-consent-decline']) {
    const box = await page.locator(sel).boundingBox();
    expect(box.x, sel).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, sel).toBeLessThanOrEqual(width);
  }
});
