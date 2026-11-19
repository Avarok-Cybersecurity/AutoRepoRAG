// SPDX-License-Identifier: Apache-2.0
// What a search result shows (src/core/search-results.js): a link only to an
// http(s) url, the title, the heading breadcrumb, and a snippet around the
// first query term with the terms marked. Payloads are untrusted data.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { safeHttpUrl, searchCorpora, snippet, toResult } from '../../src/core/search-results.js';

const plain = (segments) => segments.map((s) => s.text).join('');
const marked = (segments) => segments.filter((s) => s.hit).map((s) => s.text);

describe('safeHttpUrl', () => {
  it('keeps http(s) urls, fragments included, and nothing else', () => {
    assert.equal(safeHttpUrl('https://site.test/about/'), 'https://site.test/about/');
    assert.equal(safeHttpUrl('http://site.test/a#contact'), 'http://site.test/a#contact');
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', '/about/', 'about/index.md', '', 7, null, 'https://']) {
      assert.equal(safeHttpUrl(bad), null, String(bad));
    }
  });
});

describe('snippet', () => {
  const text = '## Contact\n\nYou can reach the **support** team by [email](mailto:x@y.test) or `chat`. ' + 'Filler words go here. '.repeat(20) + 'The billing desk answers invoices.';

  it('drops markdown syntax and heading lines, and marks every query term', () => {
    const s = snippet(text, 'support email', 200);
    assert.ok(plain(s).startsWith('You can reach the support team by email or chat.'), plain(s));
    assert.deepEqual(marked(s), ['support', 'email']);
  });

  it('windows around the first matching term, at word boundaries, with ellipses', () => {
    const s = plain(snippet(text, 'invoices', 80));
    assert.ok(s.startsWith('…'), s);
    assert.ok(s.includes('invoices'), s);
    assert.ok(s.length <= 82, `${s.length}: ${s}`);
    assert.ok(!/\s…$|^…\s/.test(s), s);
  });

  it('with no match, starts at the beginning', () => {
    const s = plain(snippet(text, 'zebra', 60));
    assert.ok(s.startsWith('You can reach'), s);
    assert.ok(s.endsWith('…'), s);
  });

  it('a chunk that is only a heading still shows its words', () => {
    assert.equal(plain(snippet('# About', 'about', 100)), 'About');
  });

  it('a query full of regex syntax is matched literally', () => {
    assert.doesNotThrow(() => snippet('a (b) [c] *d*', '(b) [c', 50));
  });
});

describe('toResult', () => {
  const corpus = { id: 'site' };
  const hit = (payload, id = 3) => ({ corpus, hit: { id, score: 1.2, payload }, rank: 1 });

  it('a markdown chunk of a page: link, title, breadcrumb, snippet', () => {
    const r = toResult(hit({ url: 'https://site.test/about/', title: 'About us', heading_path: ['About', 'Contact'], text: '## Contact\n\nWrite to us.', path: 'about/index.md' }), 'write', 120);
    assert.equal(r.key, 'site:3');
    assert.equal(r.corpusId, 'site');
    assert.equal(r.url, 'https://site.test/about/');
    assert.equal(r.title, 'About us');
    assert.deepEqual(r.crumbs, ['About', 'Contact']);
    assert.equal(plain(r.snippet), 'Write to us.');
  });

  it('an unsafe url is no link; a missing title falls back to the deepest heading, then the path', () => {
    const r = toResult(hit({ url: 'javascript:alert(1)', heading_path: ['Guide', 'Install'], text: 'x' }), 'x', 120);
    assert.equal(r.url, null);
    assert.equal(r.title, 'Install');
    assert.equal(toResult(hit({ path: 'docs/a.md', text: 'x' }), 'x', 120).title, 'docs/a.md');
    assert.equal(toResult(hit({ text: 'x' }, 9), 'x', 120).title, '#9');
  });

  it('junk in heading_path and text is ignored, not rendered', () => {
    const r = toResult(hit({ heading_path: ['A', 7, '', null, ' B '], text: { evil: true } }), 'x', 120);
    assert.deepEqual(r.crumbs, ['A', 'B']);
    assert.deepEqual(r.snippet, []);
  });
});

describe('searchCorpora', () => {
  it('queries each corpus with its own plan, fuses by rank and shapes the results', async () => {
    const bodies = [];
    const query = async (collection, body) => {
      bodies.push([collection, body]);
      const n = collection === 'site' ? [1, 2] : [5];
      return n.map((id) => ({ id, score: 1, payload: { title: `${collection} ${id}`, text: 'free plan limits', url: `https://${collection}.test/${id}` } }));
    };
    const corpora = [
      { id: 'site', collection: 'site', plan: { kind: 'bm25', model: null } },
      { id: 'blog', collection: 'blog', plan: { kind: 'hybrid', model: 'm' } },
    ];
    const results = await searchCorpora('plan', { query, corpora, topK: 3, snippetChars: 80 });
    assert.deepEqual(results.map((r) => r.title), ['site 1', 'blog 5', 'site 2']);
    assert.equal(bodies[0][1].query.model, 'bm25');
    assert.deepEqual(bodies[1][1].query, { fusion: 'rrf' });
    assert.deepEqual(marked(results[0].snippet), ['plan']);
  });

  it('one failing corpus fails the search, rather than showing a silently partial list', async () => {
    const query = async (collection) => {
      if (collection === 'blog') throw new Error('search.embedder returned 4 dimensions');
      return [];
    };
    const corpora = [
      { id: 'site', collection: 'site', plan: { kind: 'bm25', model: null } },
      { id: 'blog', collection: 'blog', plan: { kind: 'hybrid', model: 'm' } },
    ];
    await assert.rejects(searchCorpora('x', { query, corpora, topK: 3, snippetChars: 80 }), /4 dimensions/);
  });
});
