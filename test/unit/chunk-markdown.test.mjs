// chunk-markdown.test.mjs — the heading-aware markdown chunker (pure).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { chunkMarkdown } from '../../src/chunk-markdown.mjs';

const BIG = 100_000;

/** The lines a chunk claims, re-read from the source: chunk text must be exactly that slice. */
function sliceOf(text, c) {
  return text.split('\n').slice(c.startLine - 1, c.endLine).join('\n');
}

describe('chunkMarkdown: sections', () => {
  const doc = [
    'Intro before any heading.',
    '',
    '# About',
    '',
    'We build things.',
    '',
    '## Contact',
    '',
    'Mail us.',
    '',
    '# Pricing ##',
    'Free plan.',
  ].join('\n');

  it('splits at every heading and keeps the heading path', () => {
    const chunks = chunkMarkdown(doc, { maxChunkBytes: BIG, path: 'a.md' });
    assert.deepEqual(chunks.map((c) => c.headingPath), [[], ['About'], ['About', 'Contact'], ['Pricing']]);
    assert.deepEqual(chunks.map((c) => [c.startLine, c.endLine]), [[1, 1], [3, 5], [7, 9], [11, 12]]);
  });

  it('chunk text is exactly the source lines it claims (no trailing blank lines)', () => {
    for (const c of chunkMarkdown(doc, { maxChunkBytes: BIG, path: 'a.md' })) {
      assert.equal(c.text, sliceOf(doc, c));
      assert.notEqual(c.text.at(-1), '\n');
    }
  });

  it('a heading with no body is carried into the next section, not dropped', () => {
    const md = '# Docs\n\n## Install\n\nRun it.\n';
    const chunks = chunkMarkdown(md, { maxChunkBytes: BIG, path: 'd.md' });
    assert.equal(chunks.length, 1);
    assert.deepEqual(chunks[0].headingPath, ['Docs', 'Install']);
    assert.equal(chunks[0].text, '# Docs\n\n## Install\n\nRun it.');
  });

  it('a trailing heading-only section is still emitted', () => {
    const chunks = chunkMarkdown('Body.\n\n# End\n', { maxChunkBytes: BIG, path: 'e.md' });
    assert.deepEqual(chunks.map((c) => c.text), ['Body.', '# End']);
    assert.deepEqual(chunks[1].headingPath, ['End']);
  });

  it('a shallower heading pops deeper levels; skipped levels are fine', () => {
    const md = '# A\nx\n### C\ny\n## B\nz\n';
    const paths = chunkMarkdown(md, { maxChunkBytes: BIG, path: 'p.md' }).map((c) => c.headingPath);
    assert.deepEqual(paths, [['A'], ['A', 'C'], ['A', 'B']]);
  });

  it('heading text loses closing hashes, link syntax and emphasis markers', () => {
    const md = '# [Home](/) **page** ###\nx\n';
    assert.deepEqual(chunkMarkdown(md, { maxChunkBytes: BIG, path: 'h.md' })[0].headingPath, ['Home page']);
  });

  it('"#tag" without a space and 7 hashes are not headings', () => {
    const md = '#tag\n####### seven\ntext\n';
    const chunks = chunkMarkdown(md, { maxChunkBytes: BIG, path: 't.md' });
    assert.equal(chunks.length, 1);
    assert.deepEqual(chunks[0].headingPath, []);
  });

  it('empty and whitespace-only documents produce no chunks', () => {
    assert.deepEqual(chunkMarkdown('', { maxChunkBytes: BIG, path: 'x.md' }), []);
    assert.deepEqual(chunkMarkdown('\n  \n\n', { maxChunkBytes: BIG, path: 'x.md' }), []);
  });

  it('YAML front matter belongs to the first section and is never read as headings', () => {
    const md = '---\ntitle: x\n# not: a heading\n---\n# Real\nbody\n';
    const chunks = chunkMarkdown(md, { maxChunkBytes: BIG, path: 'f.md' });
    assert.deepEqual(chunks.map((c) => c.headingPath), [[], ['Real']]);
    assert.equal(chunks[0].text, '---\ntitle: x\n# not: a heading\n---');
  });
});

describe('chunkMarkdown: code fences and tables', () => {
  it('a "#" line inside a fenced code block is not a heading', () => {
    const md = '# Shell\n\n```sh\n# comment\necho hi\n```\n\nafter\n';
    const chunks = chunkMarkdown(md, { maxChunkBytes: BIG, path: 'c.md' });
    assert.equal(chunks.length, 1);
    assert.deepEqual(chunks[0].headingPath, ['Shell']);
  });

  it('a fence closes only on the same character with at least the same length', () => {
    const md = '````md\n```\n# inside\n```\n````\n# Out\nx\n';
    const chunks = chunkMarkdown(md, { maxChunkBytes: BIG, path: 'c.md' });
    assert.deepEqual(chunks.map((c) => c.headingPath), [[], ['Out']]);
    assert.equal(chunks[0].endLine, 5);
  });

  it('an unclosed fence runs to the end of the file', () => {
    const md = '# A\n~~~\n# still code\n';
    const chunks = chunkMarkdown(md, { maxChunkBytes: BIG, path: 'u.md' });
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].endLine, 3);
  });

  it('long sections split at paragraph boundaries, never inside a fence or a table', () => {
    const para = (n) => `Paragraph ${n} ${'word '.repeat(12).trim()}.`;
    const fence = ['```js', ...Array.from({ length: 6 }, (_, i) => `const v${i} = ${i};`), '```'];
    const table = ['| a | b |', '|---|:-:|', ...Array.from({ length: 6 }, (_, i) => `| ${i} | ${i * 2} |`)];
    const md = ['# Long', '', para(1), '', ...fence, '', para(2), '', ...table, '', para(3), ''].join('\n');
    const max = 160;
    const chunks = chunkMarkdown(md, { maxChunkBytes: max, path: 'l.md' });
    assert.ok(chunks.length >= 3, `${chunks.length} chunks`);
    for (const c of chunks) {
      assert.ok(Buffer.byteLength(c.text) <= max, `${Buffer.byteLength(c.text)} > ${max}`);
      assert.equal(c.text, sliceOf(md, c));
      assert.deepEqual(c.headingPath, ['Long']);
      const ticks = c.text.split('\n').filter((l) => l.startsWith('```')).length;
      assert.equal(ticks % 2, 0, `fence split in chunk ${c.startLine}-${c.endLine}`);
      const rows = c.text.split('\n').filter((l) => l.startsWith('|'));
      assert.ok(rows.length === 0 || rows.length === table.length, 'table split across chunks');
    }
    const covered = chunks.map((c) => c.text).join('\n');
    for (const line of [...fence, ...table]) assert.ok(covered.includes(line));
  });

  it('a fenced block larger than max-chunk-bytes fails naming the file, line and sizes', () => {
    const md = `# A\n\n\`\`\`\n${'x'.repeat(300)}\n\`\`\`\n`;
    assert.throws(
      () => chunkMarkdown(md, { maxChunkBytes: 100, path: 'docs/big.md' }),
      { message: /^docs\/big\.md:3: a fenced code block of 30\d bytes exceeds max-chunk-bytes \(100\)/ },
    );
  });

  it('a table larger than max-chunk-bytes fails too', () => {
    const rows = Array.from({ length: 20 }, (_, i) => `| row ${i} | value ${i} |`);
    const md = ['| h | v |', '|---|---|', ...rows].join('\n');
    assert.throws(() => chunkMarkdown(md, { maxChunkBytes: 100, path: 't.md' }), { message: /^t\.md:1: a table of \d+ bytes/ });
  });

  it('an oversized plain paragraph is split at line, then word, boundaries without losing text', () => {
    const words = Array.from({ length: 80 }, (_, i) => `w${i}`);
    const md = `# P\n${words.join(' ')}\n`;
    const chunks = chunkMarkdown(md, { maxChunkBytes: 64, path: 'p.md' });
    assert.ok(chunks.length > 2);
    for (const c of chunks) assert.ok(Buffer.byteLength(c.text) <= 64);
    const rejoined = chunks.map((c) => c.text).join(' ').replace(/^# P\s+/, '').split(/\s+/);
    assert.deepEqual(rejoined, words);
  });

  it('never splits a multi-byte character', () => {
    const md = `${'é'.repeat(100)}\n`;
    const chunks = chunkMarkdown(md, { maxChunkBytes: 33, path: 'u.md' });
    assert.equal(chunks.map((c) => c.text).join(''), 'é'.repeat(100));
    for (const c of chunks) assert.ok(!c.text.includes('�'));
  });
});
