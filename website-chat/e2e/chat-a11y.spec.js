// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-a11y.spec.js — axe on the open dialog in every state a visitor walks
// through (no serious or critical violation, WCAG 2.2 AA + best practice), and
// the specific fixes behind it: a 24px sources toggle, keyboard-reachable code
// blocks, a status announcer that says each stage once instead of every 0.1 MB,
// and a key row that stays legible at 390px. Desktop and phone.
// =============================================================================

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CORS_HEADERS } from './fixtures/openrouter.js';
import { CODE, GZ, isMobile, openAnswered, openChat, routeCorpus, waitReady, withKey } from './fixtures/chat-helpers.js';
import { startSlowServer } from './fixtures/slow-server.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/** Serious and critical axe findings inside the dialog, as "rule: target" lines. */
async function seriousViolations(page) {
  const { violations } = await new AxeBuilder({ page }).include('.cc').withTags(TAGS).analyze();
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')}`));
}

// An answer with a reasoning trace and a code line far wider than a phone.
const WIDE_CODE = ['The verifier keeps the longest accepted prefix [1].\n\n', '```rust\n', `let kept = draft.iter().zip(verified).take_while(|(d, v)| v.argmax() == **d).count(); // ${'x'.repeat(80)}\n`, '```\n'];

test('axe: no serious or critical violation in any state of the open dialog', async ({ page, context }) => {
  await routeCorpus(context);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  expect(await seriousViolations(page), 'ready, no key').toEqual([]);

  await page.locator('.cc-key-input').fill('e2e-fixture-not-a-key');
  await page.locator('.cc-key-save').click();
  await expect(page.locator('.cc-connected')).toBeVisible();
  expect(await seriousViolations(page), 'ready, key connected').toEqual([]);

  await page.locator('.cc-keyrow-swap').click();
  expect(await seriousViolations(page), 'swap form').toEqual([]);
  await page.locator('.cc-key-keep').click();
});

test('axe: an answered question with sources open and a wide code block', async ({ page, context }) => {
  await openAnswered(page, context, { content: WIDE_CODE, reasoning: ['Looking at the verifier. ', 'It zips drafts with logits.'] });
  const details = page.locator('.cm-sources');
  if (!(await details.evaluate((d) => d.open))) await details.locator('summary').click();
  await expect(page.locator('.cm-src').first()).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);

  await page.locator('.cc-clear').click();
  expect(await seriousViolations(page), 'conversation cleared').toEqual([]);
});

test('the sources toggle is at least 24 by 24 CSS px', async ({ page, context }) => {
  await openAnswered(page, context);
  const box = await page.locator('.cm-sources > summary').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(24);
  expect(box.width).toBeGreaterThanOrEqual(24);
});

test('a code block is a named, keyboard-reachable scroll region', async ({ page, context }) => {
  await openAnswered(page, context, { content: WIDE_CODE });
  const pre = page.locator('.cm-body pre.cc-fence');
  await expect(pre).toHaveAttribute('tabindex', '0');
  await expect(pre).toHaveAttribute('role', 'region');
  await expect(pre).toHaveAttribute('aria-label', /\S/);

  await page.locator('.cc-close').focus();
  let reached = false;
  for (let i = 0; i < 25 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await pre.evaluate((el) => el === document.activeElement);
  }
  expect(reached).toBe(true);
  // Arrow keys scroll it once focused (it is wider than its box on a phone).
  if (isMobile(page)) {
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => pre.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  }
});

test('the status announcer says each stage once, not every progress tick', async ({ page, context }) => {
  const hits = await routeCorpus(context);
  const slow = await startSlowServer(GZ, { chunkSize: 256, delayMs: 40 });
  await context.unroute(CODE.gzUrl);
  await context.route(CODE.gzUrl, async (route) => {
    hits.gz++;
    await route.fulfill({ status: 302, headers: { ...CORS_HEADERS, location: slow.url } });
  });
  try {
    await page.goto('/');
    // Every text change of every live region in the dialog, and of the pill.
    await page.evaluate(() => {
      window.__announced = [];
      window.__pill = [];
      const seen = new Map();
      const observer = new MutationObserver(() => {
        for (const el of document.querySelectorAll('.cc [aria-live], .cc [role="status"], .cc [role="alert"]')) {
          if (el.closest('[role="log"]')) continue;
          const t = el.textContent.trim();
          if (seen.get(el) !== t) {
            seen.set(el, t);
            if (t) window.__announced.push(t);
          }
        }
        const pill = document.querySelector('.cc-status-text')?.textContent;
        if (pill && window.__pill.at(-1) !== pill) window.__pill.push(pill);
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    await openChat(page);
    await waitReady(page);

    const { announced, pill } = await page.evaluate(() => ({ announced: window.__announced, pill: window.__pill }));
    // The pill showed running numbers (MB downloaded, chunks indexed) ...
    expect(pill.some((t) => /downloading corpus \d+\.\d of \d+\.\d MB/.test(t))).toBe(true);
    // ... but what is announced carries none of them and stays short.
    expect(announced.filter((t) => /\d+\.\d of \d+\.\d MB|\d+ of \d+/.test(t))).toEqual([]);
    expect(announced.length).toBeLessThanOrEqual(10);
    // The ready line itself is announced, once.
    expect(announced.filter((t) => /^ready · /.test(t))).toHaveLength(1);
    await expect(page.locator('.cc-status')).not.toHaveAttribute('aria-live', /.*/);
  } finally {
    await slow.close();
  }
});

test('the connected key row stays legible on a phone', async ({ page, context }) => {
  test.skip(!isMobile(page), 'phone project only');
  await routeCorpus(context);
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  // Each label renders on one line (no word-per-line stacking) ...
  for (const sel of ['.cc-connected', '.cc-keyrow-note', '.cc-keyrow-swap', '.cc-model-label']) {
    const lines = await page.locator(sel).evaluate((el) => {
      // The line boxes of the label's own text (a decorative dot is not a line).
      const tops = new Set();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) tops.add(Math.round(r.top));
      }
      return tops.size;
    });
    expect(lines, sel).toBe(1);
  }
  // ... and the answer model's id is shown whole.
  const id = page.locator('.cc-model-id');
  expect(await id.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  // Nothing in the row spills past the sheet.
  const row = await page.locator('.cc-keyrow').boundingBox();
  expect(row.x + row.width).toBeLessThanOrEqual(page.viewportSize().width);
});
