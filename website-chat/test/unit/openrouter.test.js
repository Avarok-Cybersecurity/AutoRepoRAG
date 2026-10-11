// SPDX-License-Identifier: Apache-2.0
// The OpenRouter adapter (src/adapters/openrouter.js). Only the transport
// (`fetch`) and the backoff clock (`sleep`) are stubbed — the I/O boundary.
// Everything under test (retry, parseResponse, the shape guards, quota
// detection, the SSE reader) is the production path.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createOpenRouter, OpenRouterError } from '../../src/adapters/openrouter.js';

const PROVIDER = { apiUrl: 'https://or.test/api/v1', appTitle: 'T', referer: 'https://site.test', maxAttempts: 3, retryBaseMs: 700 };

/** A transport that answers each call from `responders` in turn (the last one repeats). */
function harness(responders) {
  const calls = [];
  const sleeps = [];
  const io = {
    fetch: async (url, init) => {
      calls.push({ url, init, body: JSON.parse(init.body) });
      return responders[Math.min(calls.length - 1, responders.length - 1)]();
    },
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  };
  return { or: createOpenRouter(PROVIDER, io), calls, sleeps };
}

const jsonResponse = (body, { ok = true, status = 200, headers = {} } = {}) => () => ({
  ok,
  status,
  headers: new Headers({ 'content-type': 'application/json', ...headers }),
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

function sseResponse(frames) {
  return () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'text/event-stream' }),
    body: new ReadableStream({
      start(c) {
        for (const f of frames) c.enqueue(new TextEncoder().encode(f));
        c.close();
      },
    }),
  });
}

async function caught(promise) {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  assert.fail('expected a rejection');
}

describe('request shape', () => {
  it('posts to config.provider.apiUrl with its attribution headers and the model it is given', async () => {
    const { or, calls } = harness([jsonResponse({ data: [{ index: 0, embedding: [1] }] })]);
    await or.getEmbedding('q', 'sk-test', 'embed/model');
    assert.equal(calls[0].url, 'https://or.test/api/v1/embeddings');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer sk-test');
    assert.equal(calls[0].init.headers['HTTP-Referer'], 'https://site.test');
    assert.equal(calls[0].init.headers['X-Title'], 'T');
    assert.deepEqual(calls[0].body, { model: 'embed/model', input: ['q'] });
  });
});

// A 200 carrying something other than the documented envelope. Retrying
// cannot change a shape, so these must fail fast rather than burn retries.
describe('shape guards', () => {
  for (const body of [{}, { data: null }, { data: 'not-an-array' }, { data: { 0: 'x' } }, []]) {
    it(`an embedding body of ${JSON.stringify(body)} names itself, once`, async () => {
      const { or, calls } = harness([jsonResponse(body)]);
      const e = await caught(or.getEmbeddings(['hello'], 'k', 'm'));
      assert.ok(e instanceof OpenRouterError);
      assert.equal(e.message, 'Embedding request returned no embeddings.');
      assert.equal(e.transient, false);
      assert.equal(calls.length, 1);
    });
  }

  it('a rerank body with no results does the same', async () => {
    for (const body of [{}, { results: null }, { results: 'nope' }]) {
      const { or } = harness([jsonResponse(body)]);
      const e = await caught(or.rerank('q', ['a', 'b'], 'k', 3, 'r'));
      assert.equal(e.message, 'Rerank request returned no results.');
    }
  });

  it('well-formed responses come back ordered', async () => {
    const { or } = harness([jsonResponse({ data: [{ index: 1, embedding: [0.2] }, { index: 0, embedding: [0.1] }] })]);
    assert.deepEqual(await or.getEmbeddings(['a', 'b'], 'k', 'm'), [[0.1], [0.2]]);
    const r = harness([jsonResponse({ results: [{ index: 0, relevance_score: 0.1 }, { index: 2, relevance_score: 0.9 }] })]);
    assert.deepEqual(await r.or.rerank('q', ['a', 'b', 'c'], 'k', 3, 'r'), [
      { index: 2, score: 0.9 },
      { index: 0, score: 0.1 },
    ]);
  });

  it('an empty input list never reaches the network', async () => {
    const { or, calls } = harness([jsonResponse({})]);
    assert.deepEqual(await or.getEmbeddings([], 'k', 'm'), []);
    assert.equal(calls.length, 0);
  });
});

describe('retry policy', () => {
  it('a transient 429 is retried maxAttempts times with exponential backoff from retryBaseMs', async () => {
    const { or, calls, sleeps } = harness([jsonResponse({ error: { code: 429, message: 'Rate limit exceeded: free tier' } }, { ok: false, status: 429 })]);
    const e = await caught(or.getEmbedding('q', 'k', 'm'));
    assert.equal(e.transient, true);
    assert.equal(calls.length, 3);
    assert.deepEqual(sleeps, [700, 1400]);
  });

  it('a 200 with an error body is transient too, and a later success wins', async () => {
    const { or, calls } = harness([
      jsonResponse({ error: { code: 429, message: 'Upstream error from Nvidia: ResourceExhausted' } }),
      jsonResponse({ data: [{ index: 0, embedding: [3] }] }),
    ]);
    assert.deepEqual(await or.getEmbedding('q', 'k', 'm'), [3]);
    assert.equal(calls.length, 2);
  });

  it('a spent daily allowance is never retried and carries its reset stamp', async () => {
    const body = { error: { code: 429, message: 'Rate limit exceeded: free-models-per-day. ', metadata: { limit_source: 'openrouter_free_tier_daily', headers: { 'X-RateLimit-Reset': '1786924800000' } } } };
    const { or, calls, sleeps } = harness([jsonResponse(body, { ok: false, status: 429 })]);
    const e = await caught(or.chat([], 'sys', 'k', { onDelta() {}, model: 'c:free' }));
    assert.equal(e.quota, true);
    assert.equal(e.resetAt, 1786924800000);
    assert.equal(calls.length, 1);
    assert.deepEqual(sleeps, []);
  });

  it('a 401 is not transient', async () => {
    const { or, calls } = harness([jsonResponse('{"error":{"message":"No auth credentials found"}}', { ok: false, status: 401 })]);
    const e = await caught(or.rerank('q', ['a', 'b'], 'k', 3, 'r'));
    assert.equal(e.transient, false);
    assert.equal(calls.length, 1);
  });
});

describe('chat streaming', () => {
  const frame = (delta) => `data: ${JSON.stringify({ choices: [{ index: 0, delta }] })}\n\n`;

  it('streams reasoning (both shapes) then content, honouring [DONE]', async () => {
    const deltas = [];
    const { or } = harness([
      sseResponse([': keepalive\n\n', frame({ reasoning: 'think ' }), frame({ reasoning_details: [{ text: 'more' }] }), frame({ content: 'Ans' }), frame({ content: 'wer' }), 'data: [DONE]\n\n', frame({ content: 'IGNORED' })]),
    ]);
    const answer = await or.chat([{ role: 'user', content: 'q' }], 'sys', 'k', { onDelta: (d) => deltas.push(d), model: 'c' });
    assert.equal(answer, 'Answer');
    assert.deepEqual(deltas.map((d) => d.reasoning ?? d.content), ['think ', 'more', 'Ans', 'wer']);
  });

  it('a mid-stream error after the first token surfaces without any retry', async () => {
    const { or, calls } = harness([sseResponse([frame({ reasoning: 'r' }), `data: ${JSON.stringify({ error: { code: 429, message: 'ResourceExhausted mid stream' } })}\n\n`])]);
    const e = await caught(or.chat([], 'sys', 'k', { onDelta() {}, model: 'c' }));
    assert.match(e.message, /mid stream/);
    assert.equal(calls.length, 1);
  });

  it('sends the system prompt first and the model it is given', async () => {
    const { or, calls } = harness([jsonResponse({ choices: [{ message: { content: 'ok' } }] })]);
    assert.equal(await or.chat([{ role: 'user', content: 'q' }], 'SYSTEM', 'k', { onDelta() {}, model: 'paid/model' }), 'ok');
    assert.equal(calls[0].body.model, 'paid/model');
    assert.deepEqual(calls[0].body.messages[0], { role: 'system', content: 'SYSTEM' });
    assert.equal(calls[0].body.stream, true);
  });
});
