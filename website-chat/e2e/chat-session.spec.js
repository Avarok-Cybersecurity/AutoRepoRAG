// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-session.spec.js — closing the dialog is not "start over". The
// conversation, an unsent draft and an answer still in flight all survive a
// close and reopen within the page; starting over is an explicit, undoable
// "new conversation". Focus never leaves the dialog: a keyboard Ask keeps it
// on the input, a pointer Ask moves it to the conversation, and Tab from a
// focus that fell to <body> comes back inside. Desktop and phone.
// =============================================================================

import { test, expect } from '@playwright/test';
import { dialogOf, focusState, gapBetween, isMobile, openAnswered, openChat, routeAnswer, routeCorpus, statusText, waitReady, withKey } from './fixtures/chat-helpers.js';

const QUESTION = 'how does the verifier keep draft tokens?';

async function closeChat(page, how) {
  if (how === 'escape') await page.keyboard.press('Escape');
  else if (how === 'button') await page.locator('.cc-close').click();
  else await page.locator('.cc-backdrop').click({ position: { x: 8, y: 8 } });
  await expect(dialogOf(page)).toBeHidden();
}

for (const how of ['escape', 'button', 'backdrop']) {
  test(`closing by ${how} keeps the conversation and the draft`, async ({ page, context }) => {
    test.skip(how === 'backdrop' && isMobile(page), 'the phone sheet is full-bleed: no backdrop to click');
    await openAnswered(page, context, { question: QUESTION });
    await page.locator('.cc-input').fill('and the unsent follow-up');

    await closeChat(page, how);
    await openChat(page);

    await expect(page.locator('.cm-user')).toHaveText(new RegExp(QUESTION));
    await expect(page.locator('.cm-card .cm-body')).toContainText('longest accepted prefix');
    await expect(page.locator('.cc-input')).toHaveValue('and the unsent follow-up');
    await expect(statusText(page)).toContainText('ready ·');
  });
}

test('a draft typed before the key is connected survives a close', async ({ page, context }) => {
  await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  await page.locator('.cc-input').fill('typed while keyless');
  await closeChat(page, 'button');
  await openChat(page);
  await expect(page.locator('.cc-input')).toHaveValue('typed while keyless');
});

test('an answer that lands while the dialog is closed is there on reopen', async ({ page, context }) => {
  await routeCorpus(context);
  await routeAnswer(context, { content: ['Late but complete [1].'], delayMs: 1500 });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  await page.locator('.cc-input').fill(QUESTION);
  await page.locator('.cc-input').press('Enter');
  await expect(page.locator('.cm-user')).toBeVisible();

  await closeChat(page, 'escape');
  await page.waitForTimeout(2500);
  await openChat(page);
  await expect(page.locator('.cm-card .cm-body')).toContainText('Late but complete', { timeout: 10_000 });
});

test('new conversation clears only on request, can be undone, and sits away from ask', async ({ page, context }) => {
  await openAnswered(page, context, { question: QUESTION });
  const clear = page.locator('.cc-clear');
  await expect(clear).toBeVisible();
  expect(await gapBetween(clear, page.locator('.cc-ask'))).toBeGreaterThanOrEqual(24);

  await clear.click();
  await expect(page.locator('.cm-user')).toHaveCount(0);
  await expect(page.locator('.cc-chip').first()).toBeVisible();
  const notice = page.locator('.cc-cleared[role="status"]');
  await expect(notice).toBeVisible();
  expect((await focusState(page)).inDialog).toBe(true);

  await notice.locator('.cc-undo').click();
  await expect(page.locator('.cm-user')).toHaveText(new RegExp(QUESTION));
  await expect(page.locator('.cm-card')).toHaveCount(1);
});

test('a keyboard Ask keeps focus on the input, and Tab stays inside', async ({ page, context }) => {
  await routeCorpus(context);
  await routeAnswer(context, { content: ['Kept by the verifier [1].'] });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await page.locator('.cc-input').fill(QUESTION);
  await page.locator('.cc-ask').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.cm-card .cm-body')).toContainText('Kept by the verifier', { timeout: 20_000 });

  expect(await focusState(page)).toEqual({ inDialog: true, cls: 'cc-input' });
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab');
    expect((await focusState(page)).inDialog).toBe(true);
  }
});

test('a keyboard pick of a starter keeps focus in the dialog', async ({ page, context }) => {
  await routeCorpus(context);
  await routeAnswer(context, { content: ['Kept by the verifier [1].'] });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await page.locator('.cc-chip').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.cm-card .cm-body')).toBeVisible({ timeout: 20_000 });
  expect(await focusState(page)).toEqual({ inDialog: true, cls: 'cc-input' });
});

test('a pointer Ask moves focus to the conversation, not out of the dialog', async ({ page, context }) => {
  await routeCorpus(context);
  await routeAnswer(context, { content: ['Kept by the verifier [1].'] });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await page.locator('.cc-input').fill(QUESTION);
  await page.locator('.cc-ask').click();
  await expect(page.locator('.cm-card .cm-body')).toBeVisible({ timeout: 20_000 });
  expect(await focusState(page)).toEqual({ inDialog: true, cls: 'cc-log' });
  await expect(page.locator('.cc-log')).toHaveAttribute('aria-label', /\S/);
});

// The mechanism behind the review's finding: the focused control is disabled
// under the focus (here: the draft is emptied while "ask" holds focus), focus
// falls to <body>, and Tab would walk the page behind the dialog. It lands on
// the dialog's first or last control instead.
test('Tab and Shift+Tab after the focused control is disabled land on the first and last control', async ({ page, context }) => {
  await routeCorpus(context);
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  const expected = { Tab: 'cc-close', 'Shift+Tab': await page.evaluate(() => {
    const els = [...document.querySelector('.cc').querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
    return els.at(-1).classList[0];
  }) };
  for (const key of ['Tab', 'Shift+Tab']) {
    await page.locator('.cc-input').fill('a question');
    await page.locator('.cc-ask').focus();
    await page.evaluate(() => {
      const input = document.querySelector('.cc-input');
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('.cc-ask')).toBeDisabled();
    expect((await focusState(page)).inDialog, 'focus fell out').toBe(false);
    await page.keyboard.press(key);
    expect((await focusState(page)).cls, key).toBe(expected[key]);
  }
});

test('focus moved behind the dialog by a script comes back into it', async ({ page, context }) => {
  await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  await page.locator('.open-chat').focus();
  expect((await focusState(page)).inDialog).toBe(true);
});
