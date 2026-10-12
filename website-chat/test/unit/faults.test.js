// SPDX-License-Identifier: Apache-2.0
// Which card a fault gets (src/core/ask-errors.js). The card tells the visitor
// whose problem it is, so a wrong kind sends them to fix the wrong thing:
// waiting out a "rate limit" that is really their connection, or checking
// their connection for a corpus the site never published.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { classifyAskError, corpusFaultKind, manifestFaultKind } from '../../src/core/ask-errors.js';
import { OpenRouterError, OpenRouterServiceError, OpenRouterUnreachable } from '../../src/adapters/openrouter.js';

const kind = (err) => classifyAskError(err).kind;

describe('classifyAskError', () => {
  it('a request that never reached OpenRouter is the connection', () => {
    assert.equal(kind(new OpenRouterUnreachable(new TypeError('Failed to fetch'))), 'network');
  });

  it('a server error at OpenRouter or the provider is a service error, not a rate limit or the connection', () => {
    assert.equal(kind(new OpenRouterServiceError('Chat request failed: 500 - Internal Server Error')), 'service');
  });

  it('only a transient refusal is a rate limit', () => {
    assert.equal(kind(new OpenRouterError('Chat request failed: 429 - busy', true)), 'rate');
    assert.equal(kind(new OpenRouterError('Chat request failed: 400 - bad request', false)), 'generic');
    assert.equal(kind(new Error('Chat request returned no message content')), 'generic');
  });

  it('quota, key and corpus keep their own cards', () => {
    assert.deepEqual(classifyAskError(new OpenRouterError('daily', false, { quota: true, resetAt: 42 })), { kind: 'quota', resetAt: 42 });
    assert.equal(kind(new OpenRouterError('Embedding request failed: 401 - No auth credentials found', false)), 'key');
    assert.equal(kind(new Error('the embedder returned 16 dimensions but this corpus was built with 8')), 'corpus');
  });
});

describe('load faults', () => {
  it('a manifest the network could not fetch is the connection; anything the server said is the site', () => {
    assert.equal(manifestFaultKind({ network: true, status: null }), 'manifest');
    assert.equal(manifestFaultKind({ network: false, status: 404 }), 'unavailable');
    assert.equal(manifestFaultKind(new Error('corpus meta: dim must be a positive integer')), 'unavailable');
  });

  it('a corpus file the server refused is the site; a broken transfer is retryable', () => {
    assert.equal(corpusFaultKind({ network: false, status: 404 }), 'unavailable');
    assert.equal(corpusFaultKind({ network: true, status: null }), 'corpus');
    assert.equal(corpusFaultKind(new Error('corpus fetch returned no body stream')), 'corpus');
  });
});
