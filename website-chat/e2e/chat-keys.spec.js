// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-keys.spec.js — the visitor's OpenRouter key is a secret they typed, so
// no single click loses it. "swap key" opens a replacement form and keeps the
// stored key until a new one connects; going back keeps it; forgetting it is
// its own action and can be undone. The back and forget actions never sit
// next to "connect". Runs on desktop and on the 390x844 phone sheet.
// =============================================================================

import { test, expect } from '@playwright/test';
import { OR_EMBEDDINGS } from './fixtures/openrouter.js';
import { LS_OPENROUTER_KEY, TEST_KEY, askQuestion, focusState, gapBetween, openChat, routeCorpus, waitReady, withKey } from './fixtures/chat-helpers.js';

const storedKey = (page) => page.evaluate((k) => localStorage.getItem(k), LS_OPENROUTER_KEY);

async function openKeyed(page, context) {
  await routeCorpus(context);
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  await expect(page.locator('.cc-connected')).toBeVisible();
}

test('swap key keeps the stored key until a new one connects, and going back keeps it', async ({ page, context }) => {
  await openKeyed(page, context);

  await page.locator('.cc-keyrow-swap').click();
  // The replacement form is up and focused, and nothing was deleted.
  await expect(page.locator('.cc-key-input')).toBeVisible();
  await expect(page.locator('.cc-key-input')).toBeFocused();
  expect(await storedKey(page)).toBe(TEST_KEY);
  // The stored key still answers while the form is open.
  await page.locator('.cc-input').fill('still askable?');
  await expect(page.locator('.cc-ask')).toBeEnabled();

  // Back: the connected row returns with the same key, focus on "swap key".
  await page.locator('.cc-key-keep').click();
  await expect(page.locator('.cc-connected')).toBeVisible();
  await expect(page.locator('.cc-keyrow-swap')).toBeFocused();
  expect(await storedKey(page)).toBe(TEST_KEY);

  // A new key replaces the old one only when it is connected.
  await page.locator('.cc-keyrow-swap').click();
  await page.locator('.cc-key-input').fill('e2e-replacement-key');
  expect(await storedKey(page)).toBe(TEST_KEY);
  await page.locator('.cc-key-save').click();
  await expect(page.locator('.cc-connected')).toBeVisible();
  expect(await storedKey(page)).toBe('e2e-replacement-key');
});

test('Escape in the swap form closes the dialog and the stored key survives', async ({ page, context }) => {
  await openKeyed(page, context);
  await page.locator('.cc-keyrow-swap').click();
  await page.locator('.cc-key-input').fill('half typed');
  await page.keyboard.press('Escape');
  await expect(page.locator('.cc[role="dialog"]')).toBeHidden();
  expect(await storedKey(page)).toBe(TEST_KEY);
});

test('forgetting the key is a separate action and undo brings it back', async ({ page, context }) => {
  await openKeyed(page, context);
  await page.locator('.cc-keyrow-swap').click();
  await page.locator('.cc-key-forget').click();

  expect(await storedKey(page)).toBeNull();
  const notice = page.locator('.cc-key-forgotten[role="status"]');
  await expect(notice).toBeVisible();
  await expect(page.locator('.cc-ask')).toBeDisabled();

  await notice.locator('.cc-key-undo').click();
  await expect(page.locator('.cc-connected')).toBeVisible();
  expect(await storedKey(page)).toBe(TEST_KEY);
  expect((await focusState(page)).inDialog).toBe(true);
});

test('back and forget never sit next to connect', async ({ page, context }) => {
  await openKeyed(page, context);
  await page.locator('.cc-keyrow-swap').click();
  const save = page.locator('.cc-key-save');
  for (const other of ['.cc-key-keep', '.cc-key-forget']) {
    expect(await gapBetween(page.locator(other), save), other).toBeGreaterThanOrEqual(24);
  }
});

test('a rejected key opens the swap form without deleting the stored key', async ({ page, context }) => {
  await routeCorpus(context);
  await context.route(OR_EMBEDDINGS, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    await route.fulfill({ status: 401, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: '{"error":{"message":"No auth credentials found","code":401}}' });
  });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await askQuestion(page, 'where is the kv pool?');
  const card = page.locator('.cc-error[role="alert"]');
  await expect(card.locator('.cc-error-tag')).toHaveText('key rejected', { timeout: 20_000 });
  await card.locator('.cc-error-retry').click();
  await expect(page.locator('.cc-key-input')).toBeFocused();
  expect(await storedKey(page)).toBe(TEST_KEY);
});
