// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-faults.spec.js — each fault card names the right culprit. A request
// that never reached OpenRouter is the visitor's connection, not a rate limit;
// a corpus the server answered for but does not have is the site's problem,
// not the visitor's connection. Desktop and phone.
// =============================================================================

import { test, expect } from '@playwright/test';
import { seriousViolations } from './fixtures/axe.js';
import { CORS_HEADERS, OR_EMBEDDINGS, OR_RERANK, embeddingsHandler, rerankHandler } from './fixtures/openrouter.js';
import { CODE, META, acceptDownload, askQuestion, openChat, routeAnswer, routeCorpus, statusText, waitReady, withKey } from './fixtures/chat-helpers.js';

const errorCard = (page) => page.locator('.cc-error[role="alert"]');

test('a question that cannot reach OpenRouter says so, not "rate limited", and asks again once back', async ({ page, context }) => {
  await routeCorpus(context);
  await context.route(OR_EMBEDDINGS, (route) => route.abort('internetdisconnected'));
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await askQuestion(page, 'where is the kv pool?');
  const card = errorCard(page);
  await expect(card.locator('.cc-error-tag')).toHaveText('no connection', { timeout: 20_000 });
  await expect(card.locator('.cc-error-body')).toContainText('connection');
  await expect(statusText(page)).toContainText('ready ·');

  await context.unroute(OR_EMBEDDINGS);
  await routeAnswer(context, { content: ['The KV pool lives in `kv_pool.rs` [1].'] });
  await card.locator('.cc-error-retry').click();
  await expect(page.locator('.cm-card .cm-body')).toContainText('kv_pool.rs', { timeout: 20_000 });
  await expect(errorCard(page)).toHaveCount(0);
});

test('an OpenRouter 5xx is a service error, not a rate limit or the connection', async ({ page, context }) => {
  await routeCorpus(context);
  await context.route(OR_EMBEDDINGS, embeddingsHandler({ dim: META.dim }));
  await context.route(OR_RERANK, rerankHandler());
  await context.route('https://openrouter.ai/api/v1/chat/completions', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS_HEADERS });
    await route.fulfill({ status: 500, headers: { ...CORS_HEADERS, 'content-type': 'application/json' }, body: '{"error":{"message":"Internal Server Error","code":500}}' });
  });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await askQuestion(page, 'where is the kv pool?');
  const card = errorCard(page);
  await expect(card.locator('.cc-error-tag')).toHaveText('service error', { timeout: 20_000 });
  await expect(card.locator('.cc-error-body')).not.toContainText('catching their breath');
  await expect(card.locator('.cc-error-body')).not.toContainText('connection');
  expect(await seriousViolations(page)).toEqual([]);
});

test('a non-transient OpenRouter refusal is not dressed up as a rate limit', async ({ page, context }) => {
  await routeCorpus(context);
  await context.route(OR_EMBEDDINGS, embeddingsHandler({ dim: META.dim }));
  await context.route(OR_RERANK, rerankHandler());
  await context.route('https://openrouter.ai/api/v1/chat/completions', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS_HEADERS });
    await route.fulfill({ status: 400, headers: { ...CORS_HEADERS, 'content-type': 'application/json' }, body: '{"error":{"message":"bad request","code":400}}' });
  });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);

  await askQuestion(page, 'where is the kv pool?');
  await expect(errorCard(page).locator('.cc-error-tag')).toHaveText('hiccup', { timeout: 20_000 });
});

test('a corpus manifest the server does not have is the site, not the connection', async ({ page, context }) => {
  await context.route(CODE.metaUrl, (route) => route.fulfill({ status: 404, headers: CORS_HEADERS, body: 'not found' }));
  await page.goto('/');
  await openChat(page);
  const card = errorCard(page);
  await expect(card.locator('.cc-error-tag')).toHaveText('corpus unavailable', { timeout: 20_000 });
  await expect(card.locator('.cc-error-body')).not.toContainText('your connection');
});

test('a corpus file the server does not have is the site, not the connection', async ({ page, context }) => {
  await routeCorpus(context);
  await context.unroute(CODE.gzUrl);
  await context.route(CODE.gzUrl, (route) => route.fulfill({ status: 404, headers: CORS_HEADERS, body: 'not found' }));
  await page.goto('/');
  await openChat(page);
  await acceptDownload(page);
  await expect(errorCard(page).locator('.cc-error-tag')).toHaveText('corpus unavailable', { timeout: 20_000 });
});

test('a manifest that cannot be reached at all is still the connection', async ({ page, context }) => {
  await context.route(CODE.metaUrl, (route) => route.abort('internetdisconnected'));
  await page.goto('/');
  await openChat(page);
  await expect(errorCard(page).locator('.cc-error-tag')).toHaveText('manifest unreachable', { timeout: 20_000 });
});
