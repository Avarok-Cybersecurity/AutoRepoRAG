// embed-providers.test.mjs — the live embeddings client against provider-shaped
// endpoints (Cloudflare Workers AI's OpenAI-compatible API, OpenRouter).
//
// Test double, justified: a loopback node:http server stands in for the
// provider, because CI has no Cloudflare account. It speaks only the
// documented wire shapes (request: POST <base>/embeddings, Bearer token,
// {model, input}; errors: HTTP 429 with Cloudflare's {success: false,
// errors: [{code, message}]} envelope, codes 3036 and 3040 from
// https://developers.cloudflare.com/workers-ai/platform/errors/). The
// production client runs unmodified against it.

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { nodeIo } from '../../src/adapters/node-io.mjs';
import { embedTexts as embedWith } from '../../src/embed.mjs';
import { stdoutSink } from '../../src/adapters/stdout-log.mjs';
import { installLogSink } from '../../src/log.mjs';

installLogSink(stdoutSink);

// The production node adapter (real fetch, real clock): the loopback server
// above is the only double.
const embedTexts = (texts, o) => embedWith(texts, o, nodeIo({}));

const CF_PATH = '/client/v4/accounts/acc123/ai/v1/embeddings';
let server;
let base;
let handler = () => {};
const seen = [];

before(async () => {
  server = createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      const [status, json] = handler(seen.at(-1), seen.length);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/client/v4/accounts/acc123/ai/v1`;
});
after(() => server.close());

const opts = (o = {}) => ({ endpoint: base, model: '@cf/baai/bge-base-en-v1.5', apiKey: 'cf-token', batchSize: 8, requestIntervalMs: 0, maxRetries: 3, ...o });
const openAiList = (vectors, withIndex = true) => ({
  object: 'list',
  data: vectors.map((embedding, index) => ({ object: 'embedding', embedding, ...(withIndex ? { index } : {}) })),
  model: '@cf/baai/bge-base-en-v1.5',
});

describe('Cloudflare Workers AI (OpenAI-compatible endpoint)', () => {
  it('POSTs {model, input} to <base>/embeddings with the Cloudflare token as Bearer', async () => {
    seen.length = 0;
    handler = () => [200, openAiList([[0.1, 0.2], [0.3, 0.4]])];
    const { vectors, dim } = await embedTexts(['a', 'b'], opts());
    assert.deepEqual(vectors, [[0.1, 0.2], [0.3, 0.4]]);
    assert.equal(dim, 2);
    assert.deepEqual(seen[0], {
      method: 'POST', url: CF_PATH, auth: 'Bearer cf-token', body: { model: '@cf/baai/bge-base-en-v1.5', input: ['a', 'b'] },
    });
  });

  it('orders by index when given, keeps response order when no item has one', async () => {
    handler = () => [200, { data: [{ embedding: [2], index: 1 }, { embedding: [1], index: 0 }] }];
    assert.deepEqual((await embedTexts(['x', 'y'], opts())).vectors, [[1], [2]]);
    handler = () => [200, openAiList([[1], [2]], false)];
    assert.deepEqual((await embedTexts(['x', 'y'], opts())).vectors, [[1], [2]]);
  });

  it('refuses a response where only some items carry an index', async () => {
    handler = () => [200, { data: [{ embedding: [1], index: 0 }, { embedding: [2] }] }];
    await assert.rejects(embedTexts(['x', 'y'], opts()), { message: /some embedding items carry an index and some do not/ });
  });

  it('does not retry 3036 (daily allocation used up): one request, a message that says so', async () => {
    seen.length = 0;
    handler = () => [429, { success: false, errors: [{ code: 3036, message: 'You have used up your daily free allocation of 10,000 neurons.' }] }];
    await assert.rejects(embedTexts(['x'], opts()), { message: /Cloudflare 3036.*daily free allocation/ });
    assert.equal(seen.length, 1);
  });

  it('retries 3040 (out of capacity) and succeeds', async () => {
    seen.length = 0;
    handler = (_req, n) => (n === 1
      ? [429, { success: false, errors: [{ code: 3040, message: 'Capacity temporarily exceeded, please try again.' }] }]
      : [200, openAiList([[1, 0]])]);
    assert.deepEqual((await embedTexts(['x'], opts())).vectors, [[1, 0]]);
    assert.equal(seen.length, 2);
  });

  it('a 200 carrying {success: false} is an error, not an empty result', async () => {
    handler = () => [200, { success: false, errors: [{ code: 5007, message: 'No such model' }], result: null }];
    await assert.rejects(embedTexts(['x'], opts({ maxRetries: 1 })), { message: /Cloudflare 5007: No such model/ });
  });
});

describe('OpenRouter-style endpoint (unchanged behaviour)', () => {
  it('HTTP 200 with an {error} body and a transient message is retried', async () => {
    seen.length = 0;
    handler = (_req, n) => (n === 1 ? [200, { error: { code: 429, message: 'rate limited' } }] : [200, openAiList([[0.5]])]);
    assert.deepEqual((await embedTexts(['x'], opts())).vectors, [[0.5]]);
    assert.equal(seen.length, 2);
  });
});
