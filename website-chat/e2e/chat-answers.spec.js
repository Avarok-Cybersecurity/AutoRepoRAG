// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-answers.spec.js — a question end to end against a mocked OpenRouter:
// the printed prompt, the receipt card, safe markdown, real source links, and
// the error cards a failed question gets (the corpus stays ready).
// =============================================================================

import { test, expect } from '@playwright/test';
import {
  OR_EMBEDDINGS,
  OR_RERANK,
  OR_CHAT,
  embeddingsHandler,
  rerankHandler,
  chatHandler,
  http429Handler,
  ok200ErrorBodyHandler,
} from './fixtures/openrouter.js';
import { CODE, COMMIT, META, askQuestion, isMobile, openChat, routeCorpus, statusText, waitReady, withKey } from './fixtures/chat-helpers.js';

/** Mock the full OpenRouter pipeline for a happy-path answer. */
async function routeOpenRouter(context, answer, { embedDim = META.dim, log } = {}) {
  await context.route(OR_EMBEDDINGS, embeddingsHandler({ dim: embedDim, log: log?.embed }));
  await context.route(OR_RERANK, rerankHandler({ log: log?.rerank }));
  await context.route(OR_CHAT, chatHandler(answer, { log: log?.chat }));
}

const ANSWER = [
  'The verifier keeps the longest accepted prefix of the draft tokens [1][2].',
  '',
  '```rust',
  'let kept = draft.iter().zip(verified).take_while(|(d, v)| v.argmax() == **d).count();',
  '```',
  '',
  'Probe: <img src=x onerror="window.__xss=1"> must print as text, never run.',
].join('\n');

test('mocked round-trip prints prompt, receipt, markdown, and real source links', async ({ page, context }) => {
  await routeCorpus(context);
  const log = { embed: [], rerank: [], chat: [] };
  await routeOpenRouter(context, ANSWER, { log });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  // Ask via the first starter chip (also proves the site's starters submit).
  const starter = await page.locator('.cc-chip').first().textContent();
  await page.locator('.cc-chip').first().click();
  await expect(page.locator('.cm-user')).toContainText(starter.trim());

  const card = page.locator('.cm-card');
  await expect(card).toBeVisible({ timeout: 15_000 });

  // Markdown: citations as <sup>, the fence as <pre><code>.
  await expect(card.locator('sup.cc-cite')).toHaveText(['[1]', '[2]']);
  await expect(card.locator('pre.cc-fence code.language-rust')).toContainText('take_while');

  // A plain JSON completion (not SSE) carries no reasoning: no trace.
  expect(await card.locator('.cm-think').count()).toBe(0);

  // XSS probe arrived escaped: rendered as text, no element, no execution.
  await expect(card.locator('.cm-body')).toContainText('<img src=x onerror=');
  expect(await card.locator('.cm-body img').count()).toBe(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();

  // Source receipts: path, line range, and a blob link pinned to the corpus commit.
  const sources = card.locator('.cm-src');
  await expect(sources).toHaveCount(3);
  const hrefPattern = new RegExp(`^https://github\\.com/${CODE.meta.repo}/blob/${COMMIT}/.+#L\\d+-L\\d+$`);
  for (const src of await sources.all()) {
    expect(await src.getAttribute('href')).toMatch(hrefPattern);
    await expect(src.locator('.cm-src-path')).not.toBeEmpty();
    await expect(src.locator('.cm-src-lines')).toHaveText(/^L\d+–\d+$/);
    await expect(src.locator('.cm-src-pct')).toHaveText(/^\d+%$/);
  }
  // One corpus: no corpus tag on the receipts.
  expect(await card.locator('.cm-src-corpus').count()).toBe(0);
  // Retrieval is deterministic (fixture vectors + fixture embedder): the MTP
  // question must surface the MTP chunks.
  const paths = await card.locator('.cm-src-path').allTextContents();
  expect(paths.some((p) => p.includes('mtp.rs'))).toBe(true);

  // The models came from the right places: the embedder from the corpus
  // meta, the reranker and answer model from config.provider.
  expect(log.embed[0].model).toBe(CODE.meta.model);
  expect(log.rerank[0].model).toBe('nvidia/llama-nemotron-rerank-vl-1b-v2:free');
  expect(log.chat[0].model).toBe('nvidia/nemotron-3-ultra-550b-a55b:free');
  expect(log.chat[0].messages[0].content).toContain('the Example Engine codebase');

  // Sources ship open on desktop and collapsed on the phone sheet.
  const details = card.locator('.cm-sources');
  if (isMobile(page)) {
    await expect(details).not.toHaveAttribute('open', '');
  } else {
    await expect(details).toHaveAttribute('open', '');
  }
});

test.describe('error states', () => {
  test('embedding 429s exhaust retries into the rate card', async ({ page, context }) => {
    await routeCorpus(context);
    const attempts = [];
    await context.route(OR_EMBEDDINGS, http429Handler({ log: attempts }));
    await withKey(page);
    await page.goto('/');
    await openChat(page);
    await waitReady(page);

    await askQuestion(page, 'what schedules decode batches?');
    const card = page.locator('.cc-error[role="alert"]');
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.locator('.cc-error-tag')).toHaveText('rate limited');
    expect(attempts.length).toBe(3); // config.provider.maxAttempts, all POSTs
  });

  test('chat 200-with-error-body surfaces the rate card', async ({ page, context }) => {
    await routeCorpus(context);
    const attempts = [];
    await context.route(OR_EMBEDDINGS, embeddingsHandler({ dim: META.dim }));
    await context.route(OR_RERANK, rerankHandler());
    await context.route(OR_CHAT, ok200ErrorBodyHandler({ log: attempts }));
    await withKey(page);
    await page.goto('/');
    await openChat(page);
    await waitReady(page);

    await askQuestion(page, 'how do NVFP4 kernels dispatch?');
    const card = page.locator('.cc-error[role="alert"]');
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.locator('.cc-error-tag')).toHaveText('rate limited');
    expect(attempts.length).toBe(3); // 200-with-error-body is retried as transient
  });

  test('a rejected key offers the swap, which brings the key form back', async ({ page, context }) => {
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
    await expect(page.locator('.cc-key-input')).toBeVisible();
    await expect(statusText(page)).toContainText('ready ·');
  });

  test('embedding dimension mismatch prints a legible sync error', async ({ page, context }) => {
    await routeCorpus(context);
    await context.route(OR_EMBEDDINGS, embeddingsHandler({ dim: 16 }));
    await withKey(page);
    await page.goto('/');
    await openChat(page);
    await waitReady(page);

    await askQuestion(page, 'where is the kv pool?');
    const card = page.locator('.cc-error[role="alert"]');
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.locator('.cc-error-body')).toContainText(`returned 16 dimensions but this corpus was built with ${META.dim}`);
    // A chat-time fault must not knock the corpus out of ready.
    await expect(statusText(page)).toContainText('ready ·');
  });

  // The rerank API returns positions into the documents WE sent; an index the
  // response invented used to take the whole answer down with a TypeError.
  test('a rerank index that points nowhere does not take the answer down', async ({ page, context }) => {
    await routeCorpus(context);
    await context.route(OR_EMBEDDINGS, embeddingsHandler({ dim: META.dim }));
    await context.route(OR_CHAT, chatHandler('The KV pool lives in `kv_pool.rs` [1].'));
    await context.route(OR_RERANK, async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
      const body = route.request().postDataJSON();
      // Scores matter: only the top topK of the RANKED list are used, so the
      // bad indices must score into it to reach the guard.
      await route.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
        body: JSON.stringify({
          results: [
            { index: 'length', relevance_score: 0.99 },
            { index: 'map', relevance_score: 0.98 },
            { index: 0, relevance_score: 0.97 },
            { index: body.documents.length + 5, relevance_score: 0.8 },
            { index: -1, relevance_score: 0.7 },
            { index: 1.5, relevance_score: 0.4 },
            { index: null, relevance_score: 0.3 },
          ],
        }),
      });
    });
    await withKey(page);
    await page.goto('/');
    await openChat(page);
    await waitReady(page);

    await askQuestion(page, 'where is the kv pool?');
    // The answer still arrives, built from the position that did resolve.
    await expect(page.locator('.cm-body').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.cm-src')).toHaveCount(1);
    await expect(statusText(page)).toContainText('ready ·');
  });
});
