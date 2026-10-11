// SPDX-License-Identifier: Apache-2.0
// The corpus transport (src/adapters/corpus.js) marks each failure with what
// the classifier needs: `network` when no response came back, `status` when
// the server answered with an error. Only `fetch` is stubbed.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createCorpusNet } from '../../src/adapters/corpus.js';

async function caught(promise) {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  assert.fail('expected a rejection');
}

const offline = { fetch: async () => Promise.reject(new TypeError('Failed to fetch')) };
const answering = (status) => ({ fetch: async () => ({ ok: false, status, headers: new Headers(), json: async () => ({}) }) });

describe('createCorpusNet', () => {
  it('no response: network, no status', async () => {
    for (const call of [(n) => n.fetchMeta('https://c.test/m.json'), (n) => n.openCorpus('https://c.test/c.gz', undefined)]) {
      const err = await caught(call(createCorpusNet(offline)));
      assert.equal(err.network, true);
      assert.equal(err.status, null);
      assert.match(err.message, /Failed to fetch/);
    }
  });

  it('an HTTP error: its status, not network', async () => {
    for (const call of [(n) => n.fetchMeta('https://c.test/m.json'), (n) => n.openCorpus('https://c.test/c.gz', undefined)]) {
      const err = await caught(call(createCorpusNet(answering(404))));
      assert.equal(err.network, false);
      assert.equal(err.status, 404);
    }
  });

  it('a cancelled download stays an AbortError', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const err = await caught(createCorpusNet({ fetch: async () => Promise.reject(abort) }).openCorpus('https://c.test/c.gz', undefined));
    assert.equal(err, abort);
  });
});
