// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chat-multi.spec.js — several corpora in one chat (?corpora=code,docs): one
// LatticeDB collection and one OPFS cache file per corpus, one question
// embedding searched against both, candidates merged by distance, ONE rerank,
// and an answer that cites both repositories. Corpora built with different
// embedders refuse to load, with a clear error and no corpus download.
// =============================================================================

import { test, expect } from '@playwright/test';
import { OR_EMBEDDINGS, OR_RERANK, OR_CHAT, embeddingsHandler, rerankHandler, chatHandler } from './fixtures/openrouter.js';
import { CODE, DOCS, askQuestion, cacheFile, cacheMeta, openChat, opfsFiles, routeCorpus, statusText, waitReady, withKey } from './fixtures/chat-helpers.js';

const MULTI = '/?corpora=code,docs';
const READY_MULTI = `ready · 2 corpora · ${CODE.meta.points + DOCS.meta.points} chunks · dim ${CODE.meta.dim}`;
const QUESTION = 'How does the scheduler decide which requests join the decode batch?';

test('two corpora load into one chat, each cached under its own commit', async ({ page, context }) => {
  const code = await routeCorpus(context, CODE);
  const docs = await routeCorpus(context, DOCS);
  await page.goto(MULTI);
  await openChat(page);
  await waitReady(page);
  await expect(statusText(page)).toHaveText(READY_MULTI);
  await expect(page.locator('.cc-boot-corpus')).toHaveText([
    `code: ${CODE.meta.points} chunks from ${CODE.meta.files} files at ${CODE.commit.slice(0, 7)}`,
    `docs: ${DOCS.meta.points} chunks from ${DOCS.meta.files} files at ${DOCS.commit.slice(0, 7)}`,
  ]);
  await expect
    .poll(() => opfsFiles(page))
    .toEqual([cacheFile('code', CODE.commit), cacheMeta('code', CODE.commit), cacheFile('docs', DOCS.commit), cacheMeta('docs', DOCS.commit)].sort());

  // Second visit: both corpora come from OPFS; only the manifests travel.
  await page.reload();
  await openChat(page);
  await waitReady(page);
  expect([code, docs]).toEqual([
    { meta: 2, gz: 1 },
    { meta: 2, gz: 1 },
  ]);
});

test('one question searches both corpora, reranks once, and cites both repositories', async ({ page, context }) => {
  await routeCorpus(context, CODE);
  await routeCorpus(context, DOCS);
  const log = { embed: [], rerank: [], chat: [] };
  await context.route(OR_EMBEDDINGS, embeddingsHandler({ dim: CODE.meta.dim, log: log.embed }));
  await context.route(OR_RERANK, rerankHandler({ log: log.rerank }));
  await context.route(OR_CHAT, chatHandler('Requests join once prefill completes [1], per the scheduler [2].', { log: log.chat }));
  await withKey(page);
  await page.goto(MULTI);
  await openChat(page);
  await waitReady(page);

  await askQuestion(page, QUESTION);
  const card = page.locator('.cm-card');
  await expect(card.locator('.cm-src')).toHaveCount(3, { timeout: 20_000 });

  // One embedding, one rerank over the merged candidates (topK * multiplier).
  expect(log.embed.length).toBe(1);
  expect(log.rerank.length).toBe(1);
  expect(log.rerank[0].documents.length).toBe(12);
  expect(log.rerank[0].top_n).toBe(3);

  // Each receipt names its corpus and links to that corpus's repo at its commit.
  const receipts = await card.locator('.cm-src').evaluateAll((els) =>
    els.map((a) => ({ corpus: a.querySelector('.cm-src-corpus')?.textContent, href: a.getAttribute('href') }))
  );
  const byCorpus = { code: CODE, docs: DOCS };
  for (const r of receipts) {
    const c = byCorpus[r.corpus];
    expect(c, `receipt corpus ${r.corpus}`).toBeTruthy();
    expect(r.href.startsWith(`https://github.com/${c.meta.repo}/blob/${c.commit}/`)).toBe(true);
  }
  expect(new Set(receipts.map((r) => r.corpus))).toEqual(new Set(['code', 'docs']));

  // The prompt tells the model about both repositories.
  const system = log.chat[0].messages[0].content;
  expect(system).toContain(`GitHub repository ${CODE.meta.repo}, commit ${CODE.commit}`);
  expect(system).toContain(`GitHub repository ${DOCS.meta.repo}, commit ${DOCS.commit}`);
});

test('corpora built with different embedding models refuse to load, before any download', async ({ page, context }) => {
  const code = await routeCorpus(context, CODE);
  const docs = await routeCorpus(context, DOCS, { meta: { ...DOCS.meta, model: 'some/other-embedder' } });
  await page.goto(MULTI);
  await openChat(page);

  const card = page.locator('.cc-error[role="alert"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.locator('.cc-error-tag')).toHaveText('corpus mismatch');
  await expect(card.locator('.cc-error-body')).toContainText(`"code" was built with ${CODE.meta.model} but "docs" with some/other-embedder`);
  await expect(statusText(page)).toHaveText('fault');
  expect(code.gz + docs.gz).toBe(0);
});

test('one corpus offline, one online: both load and the badge says cached', async ({ page, context }) => {
  const code = await routeCorpus(context, CODE);
  await routeCorpus(context, DOCS);
  await page.goto(MULTI);
  await openChat(page);
  await waitReady(page);

  await context.unroute(DOCS.metaUrl);
  await context.route(DOCS.metaUrl, (route) => route.abort('failed'));
  await page.reload();
  await openChat(page);
  await waitReady(page);
  await expect(statusText(page)).toHaveText(`${READY_MULTI} · cached · offline`);
  expect(code).toEqual({ meta: 2, gz: 1 });
});
