// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-helpers.js — shared plumbing for the browser suites: fixture corpus
// constants, corpus routing, and the open / wait-ready / ask UI drivers.
// The URLs and storage prefix mirror e2e/harness/harness.js (the consumer
// config under test).
// =============================================================================

import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CORS_HEADERS, OR_CHAT, OR_EMBEDDINGS, OR_RERANK, embeddingsHandler, rerankHandler, sseChatHandler } from './openrouter.js';

const FIX = dirname(fileURLToPath(import.meta.url));

export const KEY_PREFIX = 'arr-e2e-';
export const LS_OPENROUTER_KEY = `${KEY_PREFIX}openrouter-key`;
export const TEST_KEY = 'e2e-fixture-not-a-key';

function fixture(id) {
  const meta = JSON.parse(readFileSync(join(FIX, `${id}.meta.json`), 'utf8'));
  return {
    id,
    meta,
    gzBytes: readFileSync(join(FIX, `${id}.jsonl.gz`)),
    commit: meta.commit_sha,
    gzUrl: `https://corpus.test/${id}.jsonl.gz`,
    metaUrl: `https://corpus.test/${id}.meta.json`,
  };
}

export const CODE = fixture('code');
export const DOCS = fixture('docs');

// Single-corpus aliases, as the original suite named them.
export const META = CODE.meta;
export const GZ = CODE.gzBytes;
export const COMMIT = CODE.commit;
export const SHORT = COMMIT.slice(0, 7);
export const READY_LINE = `ready · ${SHORT} · ${META.points} chunks · dim ${META.dim}`;

export const JSON_HEADERS = { ...CORS_HEADERS, 'content-type': 'application/json' };
export const GZ_HEADERS = { ...CORS_HEADERS, 'content-type': 'application/gzip' };

/** OPFS names (src/core/cache-names.js) of a corpus at a commit. */
export const cacheFile = (id, sha) => `${KEY_PREFIX}~${id}@${sha}.jsonl`;
export const cacheMeta = (id, sha) => `${KEY_PREFIX}~${id}@${sha}.meta.json`;

/** Serve a corpus's meta + gz from fixtures, counting hits. `meta` overrides the served manifest. */
export async function routeCorpus(context, corpus = CODE, { meta = corpus.meta } = {}) {
  const hits = { meta: 0, gz: 0 };
  await context.route(corpus.metaUrl, async (route) => {
    hits.meta++;
    await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(meta) });
  });
  await context.route(corpus.gzUrl, async (route) => {
    hits.gz++;
    await route.fulfill({ status: 200, headers: GZ_HEADERS, body: corpus.gzBytes });
  });
  return hits;
}

// --- UI drivers --------------------------------------------------------------

export const isMobile = (page) => page.viewportSize().width <= 860;

export const dialogOf = (page) => page.locator('.cc[role="dialog"]');

/** Click the consumer's button and wait for the dialog. */
export async function openChat(page) {
  await page.locator('.open-chat').click();
  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

export const statusText = (page) => page.locator('.cc-status-text');

/** Press "download" on the first open's consent step. */
export async function acceptDownload(page) {
  await page.locator('.cc-consent-accept').click();
}

/**
 * Wait for 'ready'. A first open asks before it downloads anything large; the
 * suites that are not about that step accept it here.
 */
export async function waitReady(page) {
  const accept = page.locator('.cc-consent-accept');
  await expect(accept.or(page.locator('.cc-status-text', { hasText: 'ready ·' }))).toBeVisible({ timeout: 30_000 });
  if (await accept.isVisible()) await accept.click();
  await expect(statusText(page)).toContainText('ready ·', { timeout: 30_000 });
}

export function withKey(page) {
  return page.addInitScript(([k, v]) => localStorage.setItem(k, v), [LS_OPENROUTER_KEY, TEST_KEY]);
}

export async function askQuestion(page, question) {
  await page.locator('.cc-input').fill(question);
  await page.locator('.cc-ask').click();
}

export const opfsFiles = (page) =>
  page.evaluate(async () => {
    const dir = await navigator.storage.getDirectory();
    const names = [];
    for await (const [name] of dir) names.push(name);
    return names.sort();
  });

// --- answers, focus and geometry ---------------------------------------------

/**
 * Mock the whole OpenRouter pipeline for a happy-path answer: fixture
 * embeddings and rerank, and `content` streamed as SSE after `reasoning`.
 * `delayMs` holds the chat response back (a question still in flight).
 */
export async function routeAnswer(context, { reasoning = [], content, delayMs = 0, dim = META.dim }) {
  await context.route(OR_EMBEDDINGS, embeddingsHandler({ dim }));
  await context.route(OR_RERANK, rerankHandler());
  const answer = sseChatHandler(reasoning, content);
  await context.route(OR_CHAT, async (route) => {
    if (delayMs > 0 && route.request().method() === 'POST') await new Promise((r) => setTimeout(r, delayMs));
    return answer(route);
  });
}

/** Ready, keyed, one answered question on screen. */
export async function openAnswered(page, context, { question = 'how does the verifier keep draft tokens?', content, reasoning } = {}) {
  await routeCorpus(context);
  await routeAnswer(context, { content: content ?? ['The verifier keeps the longest accepted prefix [1].'], reasoning });
  await withKey(page);
  await page.goto('/');
  await openChat(page);
  await waitReady(page);
  await askQuestion(page, question);
  await expect(page.locator('.cm-card .cm-sources')).toBeVisible({ timeout: 20_000 });
}

/** Where focus is: { inDialog, cls } (cls is the focused element's first class, or its tag). */
export const focusState = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return { inDialog: !!el?.closest('.cc'), cls: el?.classList?.[0] ?? el?.tagName ?? null };
  });

/** How far apart two elements are: the larger of their horizontal and vertical separations (<= 0 when they touch or overlap). */
export async function gapBetween(a, b) {
  const [p, q] = [await a.boundingBox(), await b.boundingBox()];
  const dx = Math.max(q.x - (p.x + p.width), p.x - (q.x + q.width));
  const dy = Math.max(q.y - (p.y + p.height), p.y - (q.y + q.height));
  return Math.max(dx, dy);
}
