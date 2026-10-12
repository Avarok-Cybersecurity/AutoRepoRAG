// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-shell.spec.js — the modal itself: dialog aria, scroll lock, Escape,
// backdrop, focus return, the lazy corpus, the first-load walk, the key gate,
// the phone sheet, and the one-call API (config errors, ready, close).
// Runs in both projects: chromium (desktop) and mobile (390x844 sheet).
// No network beyond localhost: corpora and OpenRouter answer from routes.
// =============================================================================

import { test, expect } from '@playwright/test';
import { CORS_HEADERS } from './fixtures/openrouter.js';
import {
  CODE,
  GZ,
  LS_OPENROUTER_KEY,
  READY_LINE,
  TEST_KEY,
  acceptDownload,
  isMobile,
  openChat,
  routeCorpus,
  statusText,
  waitReady,
} from './fixtures/chat-helpers.js';
import { startSlowServer } from './fixtures/slow-server.mjs';

test.describe('modal shell', () => {
  test('the consumer button carries the dialog aria wiring', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('.open-chat');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
  });

  test('opens with dialog aria, locks scroll, Escape closes and returns focus', async ({ page, context }) => {
    await routeCorpus(context);
    await page.goto('/');
    const dialog = await openChat(page);

    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-label', 'Ask the codebase');
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    await expect.poll(() => page.evaluate(() => document.activeElement?.classList?.contains('open-chat') ?? false)).toBe(true);
    // The library's root element is gone, not merely hidden.
    await expect(page.locator('.arr-root')).toHaveCount(0);
    expect(await page.evaluate(() => window.__events)).toContain('close');
  });

  test('close button and backdrop click both close', async ({ page, context }) => {
    await routeCorpus(context);
    await page.goto('/');
    let dialog = await openChat(page);
    await dialog.locator('.cc-close').click();
    await expect(dialog).toBeHidden();

    if (!isMobile(page)) {
      // The backdrop is only exposed around the dialog on desktop (the phone
      // sheet is full-bleed).
      dialog = await openChat(page);
      await page.locator('.cc-backdrop').click({ position: { x: 8, y: 8 } });
      await expect(dialog).toBeHidden();
    }
  });

  test('Tab is trapped inside the dialog', async ({ page, context }) => {
    await routeCorpus(context);
    await page.goto('/');
    await openChat(page);
    await waitReady(page);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('.cc'))).toBe(true);
    }
  });

  test('the theme reaches the dialog through --arr-* properties only', async ({ page, context }) => {
    await routeCorpus(context);
    await page.goto('/');
    const dialog = await openChat(page);
    const colours = await dialog.evaluate((el) => {
      const root = el.closest('.arr-root');
      return {
        accentProp: root.style.getPropertyValue('--arr-accent'),
        card: getComputedStyle(el).backgroundColor,
        pageCard: getComputedStyle(document.documentElement).getPropertyValue('--h-card').trim(),
      };
    });
    expect(colours.accentProp).toBe('var(--h-accent)');
    // #181f28 from the harness palette, resolved through config.theme.card.
    expect(colours.card).toBe('rgb(24, 31, 40)');
    expect(colours.pageCard).toBe('#181f28');
  });
});

// =============================================================================
// lazy corpus: nothing downloads before the modal opens
// =============================================================================

test('no corpus or manifest request before the modal opens, even after warming', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  await page.goto('/');
  if (!isMobile(page)) {
    // Hovering warms the stylesheet + wasm, which must NOT touch the corpus.
    await page.locator('.open-chat').hover();
    await expect.poll(() => page.evaluate(() => !!document.querySelector('link[data-repo-chat="loaded"]'))).toBe(true);
  }
  await page.waitForTimeout(3000);
  expect(hits.meta).toBe(0);
  expect(hits.gz).toBe(0);

  await openChat(page);
  await expect.poll(() => hits.meta, { timeout: 15_000 }).toBeGreaterThan(0);
  // The corpus itself waits for the visitor's go-ahead (chat-consent.spec.js).
  await acceptDownload(page);
  await expect.poll(() => hits.gz, { timeout: 15_000 }).toBeGreaterThan(0);
});

// =============================================================================
// init walk: manifest -> downloading (MB progress) -> indexing -> ready
// =============================================================================

test('first open walks download with MB progress to ready with fixture stats', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  const slow = await startSlowServer(GZ, { chunkSize: 512, delayMs: 60 });
  await context.unroute(CODE.gzUrl);
  await context.route(CODE.gzUrl, async (route) => {
    hits.gz++;
    await route.fulfill({ status: 302, headers: { ...CORS_HEADERS, location: slow.url } });
  });
  try {
    await page.goto('/');
    // Record every status-line change so sub-second phases are still assertable.
    await page.evaluate(() => {
      window.__statusLog = [];
      const observer = new MutationObserver(() => {
        const el = document.querySelector('.cc-status-text');
        if (!el) return;
        const t = el.textContent;
        const log = window.__statusLog;
        if (log[log.length - 1] !== t) log.push(t);
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    });

    await openChat(page);
    await acceptDownload(page);
    // The loader panel is up with the determinate bar while downloading.
    await expect(page.locator('.cc-load')).toBeVisible();
    await expect(page.locator('.cc-bar[role="progressbar"]')).toBeVisible();
    await waitReady(page);

    const log = await page.evaluate(() => window.__statusLog);
    expect(log.some((t) => /downloading corpus \d+\.\d of \d+\.\d MB/.test(t))).toBe(true);
    expect(log.some((t) => /^indexing|^writing local cache/.test(t))).toBe(true);
    await expect(statusText(page)).toHaveText(READY_LINE);
    // The welcome line names the corpus, its size and its commit.
    await expect(page.locator('.cc-boot-corpus')).toHaveText(`code: ${CODE.meta.points} chunks from ${CODE.meta.files} files at ${CODE.commit.slice(0, 7)}`);
  } finally {
    await slow.close();
  }
});

// =============================================================================
// key gate
// =============================================================================

test('asking is gated on an OpenRouter key that persists across visits', async ({ page, context }) => {
  await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  // Ready but keyless: the question input works, the ask button does not.
  await expect(page.locator('.cc-input')).toBeEnabled();
  await page.locator('.cc-input').fill('what schedules decode batches?');
  await expect(page.locator('.cc-ask')).toBeDisabled();
  await expect(page.locator('.cc-hint')).toContainText('connect your OpenRouter key');

  const keyInput = page.locator('.cc-key-input');
  await expect(keyInput).toHaveAttribute('type', 'password');
  await page.locator('.cc-key-toggle').click();
  await expect(keyInput).toHaveAttribute('type', 'text');
  await keyInput.fill(TEST_KEY);
  await page.locator('.cc-key-save').click();

  await expect(page.locator('.cc-connected')).toBeVisible();
  await expect(page.locator('.cc-ask')).toBeEnabled();
  expect(await page.evaluate((k) => localStorage.getItem(k), LS_OPENROUTER_KEY)).toBe(TEST_KEY);

  // The key survives a reload (localStorage under config.storage.keyPrefix).
  await page.reload();
  await openChat(page);
  await waitReady(page);
  await expect(page.locator('.cc-connected')).toBeVisible();
  await expect(page.locator('.cc-key-input')).toBeHidden();
});

// =============================================================================
// the one-call API
// =============================================================================

test.describe('openRepoChat', () => {
  test('openRepoChat({}) throws one error listing every missing key, and mounts nothing', async ({ page }) => {
    await page.goto('/');
    const err = await page.evaluate(() => {
      try {
        window.__repoChat.openRepoChat({});
        return null;
      } catch (e) {
        return { name: e.name, problems: e.problems, message: e.message };
      }
    });
    expect(err.name).toBe('ConfigError');
    for (const path of ['mount', 'assets.cssHref', 'wasm.jsUrl', 'wasm.binUrl', 'corpora', 'provider.apiUrl', 'provider.chatModel', 'retrieval.topK', 'storage.keyPrefix', 'copy', 'brand.motifSvg', 'theme.accent']) {
      expect(err.problems.some((p) => p.startsWith(`${path}: missing`)), path).toBe(true);
    }
    await expect(page.locator('.arr-root')).toHaveCount(0);
  });

  test('ready resolves once the corpora are indexed, onReady fires once, and a reopen is instantly ready', async ({ page, context }) => {
    const hits = await routeCorpus(context);
    await page.goto('/');
    await openChat(page);
    await acceptDownload(page);
    await page.evaluate(() => window.__handle.ready);
    expect(await page.evaluate(() => window.__events)).toEqual(['ready']);
    await page.evaluate(() => window.__handle.close());
    await expect(page.locator('.cc')).toHaveCount(0);

    // Same config, same page: the loaded session is reused, nothing refetched.
    await openChat(page);
    await expect(statusText(page)).toHaveText(READY_LINE);
    await page.evaluate(() => window.__handle.ready);
    expect(hits).toEqual({ meta: 1, gz: 1 });
  });

  test('ready rejects when the chat is closed before the corpora are ready', async ({ page, context }) => {
    await context.route(CODE.metaUrl, () => new Promise(() => {})); // the manifest never answers
    await page.goto('/');
    await openChat(page);
    const outcome = await page.evaluate(async () => {
      const handle = window.__handle;
      handle.close();
      try {
        await handle.ready;
        return 'resolved';
      } catch (e) {
        return e.message;
      }
    });
    expect(outcome).toBe('the chat was closed before its corpora were ready');
  });
});

// =============================================================================
// mobile sheet behavior
// =============================================================================

test('the modal is a full-bleed sheet on a phone', async ({ page, context }) => {
  test.skip(!isMobile(page), 'mobile project only');
  await routeCorpus(context);
  await page.goto('/');
  const dialog = await openChat(page);

  const viewport = page.viewportSize();
  const box = await dialog.boundingBox();
  expect(box.width).toBe(viewport.width);
  expect(box.height).toBe(viewport.height);
  expect(box.x).toBe(0);
  expect(box.y).toBe(0);
  const styles = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderRadius, inputRow: getComputedStyle(el.querySelector('.cc-input-row')).position };
  });
  expect(styles.radius).toBe('0px');
  expect(styles.inputRow).toBe('sticky'); // input stays pinned while the log scrolls
});
