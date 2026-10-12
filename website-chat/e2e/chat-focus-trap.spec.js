// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-focus-trap.spec.js — the trap, in every engine the suite runs,
// including WebKit. WebKit does not focus a button on click, so after a
// pointer Ask focus sits on the dialog container itself, and Option+Tab (its
// Tab-to-every-control key) used to walk straight out of the dialog. The trap
// now moves focus itself on Tab, Shift+Tab and their Option/Alt forms, from
// any starting point: the container, a control, or a focus that fell to the
// page.
// =============================================================================

import { test, expect } from '@playwright/test';
import { focusState, openChat, routeAnswer, routeCorpus, waitReady, withKey } from './fixtures/chat-helpers.js';

const KEYS = ['Alt+Tab', 'Tab', 'Alt+Tab', 'Tab', 'Shift+Tab', 'Alt+Shift+Tab', 'Shift+Tab'];

test('after a pointer Ask, Tab and Option+Tab never leave the dialog', async ({ page, context }) => {
  await routeCorpus(context);
  await routeAnswer(context, { content: ['Kept by the verifier [1].'], delayMs: 1500 });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await page.locator('.cc-input').fill('how does the verifier keep draft tokens?');
  await page.locator('.cc-ask').click();
  for (const key of KEYS) {
    await page.keyboard.press(key);
    expect((await focusState(page)).inDialog, `after ${key}`).toBe(true);
  }
  await expect(page.locator('.cm-card .cm-body')).toContainText('Kept by the verifier', { timeout: 20_000 });
  for (const key of KEYS) {
    await page.keyboard.press(key);
    expect((await focusState(page)).inDialog, `after ${key}, answered`).toBe(true);
  }
});

test('from the dialog container, Tab goes to its first control and Shift+Tab to its last', async ({ page, context }) => {
  await routeCorpus(context);
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  const last = await page.evaluate(() => {
    const els = [...document.querySelector('.cc').querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
    return els.at(-1).classList[0];
  });
  for (const [key, expected] of [['Tab', 'cc-close'], ['Alt+Tab', 'cc-close'], ['Shift+Tab', last], ['Alt+Shift+Tab', last]]) {
    await page.locator('.cc[role="dialog"]').focus();
    await page.keyboard.press(key);
    expect((await focusState(page)).cls, key).toBe(expected);
  }
});
