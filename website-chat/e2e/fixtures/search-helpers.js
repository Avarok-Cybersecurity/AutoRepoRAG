// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// search-helpers.js — plumbing for the search-mode browser suite: the
// snapshot fixtures (made by make-snapshots.mjs), their routes, and the
// open / wait-ready / search drivers for e2e/harness/search.html.
// The harness vendors the bundle emitted with lattice-db v0.5.0
// (e2e/.site/repo-chat-search; see README, Developing).
// =============================================================================

import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CORS_HEADERS } from './openrouter.js';

const FIX = dirname(fileURLToPath(import.meta.url));

function snapshotFixture(id) {
  const meta = JSON.parse(readFileSync(join(FIX, `${id}.meta.json`), 'utf8'));
  return {
    id,
    meta,
    bytes: readFileSync(join(FIX, `${id}.lattice`)),
    commit: meta.commit_sha,
    snapshotUrl: `https://corpus.test/${id}.lattice`,
    metaUrl: `https://corpus.test/${id}.meta.json`,
  };
}

export const SITE = snapshotFixture('site');
export const GUIDE = snapshotFixture('guide');

/** OPFS names (src/core/cache-names.js SNAPSHOT_LAYOUT) of a snapshot at a commit. */
export const snapshotFile = (id, sha) => `arr-e2e-~${id}@${sha}.lattice`;
export const snapshotMeta = (id, sha) => `arr-e2e-~${id}@${sha}.meta.json`;

/** Serve a corpus's meta + snapshot, counting hits. `meta` / `bytes` override what is served. */
export async function routeSnapshot(context, corpus = SITE, { meta = corpus.meta, bytes = corpus.bytes } = {}) {
  const hits = { meta: 0, snapshot: 0 };
  await context.route(corpus.metaUrl, async (route) => {
    hits.meta++;
    await route.fulfill({ status: 200, headers: { ...CORS_HEADERS, 'content-type': 'application/json' }, body: JSON.stringify(meta) });
  });
  await context.route(corpus.snapshotUrl, async (route) => {
    hits.snapshot++;
    await route.fulfill({ status: 200, headers: { ...CORS_HEADERS, 'content-type': 'application/octet-stream' }, body: bytes });
  });
  return hits;
}

/** Fail the test on any request to OpenRouter: search mode has no model calls. */
export async function forbidOpenRouter(context) {
  const calls = [];
  await context.route('https://openrouter.ai/**', (route) => {
    calls.push(route.request().url());
    return route.abort();
  });
  return calls;
}

export const dialogOf = (page) => page.locator('.cc[role="dialog"]');
export const statusText = (page) => page.locator('.cc-status-text');
export const input = (page) => page.locator('.cs-input');
export const hits = (page) => page.locator('.cs-hit');

export async function openSearch(page) {
  await page.locator('.open-chat').click();
  await expect(dialogOf(page)).toBeVisible();
}

/** Accept the download if asked, then wait for 'ready'. */
export async function waitReady(page) {
  const accept = page.locator('.cc-consent-accept');
  await expect(accept.or(page.locator('.cc-status-text', { hasText: 'ready ·' }))).toBeVisible({ timeout: 30_000 });
  if (await accept.isVisible()) await accept.click();
  await expect(statusText(page)).toContainText('ready ·', { timeout: 30_000 });
}

export async function search(page, text) {
  await input(page).fill(text);
  await input(page).press('Enter');
  await expect(page.locator('.cs-count')).toContainText(text, { timeout: 15_000 });
}

export const opfsFiles = (page) =>
  page.evaluate(async () => {
    const dir = await navigator.storage.getDirectory();
    const names = [];
    for await (const [name] of dir) names.push(name);
    return names.sort();
  });
