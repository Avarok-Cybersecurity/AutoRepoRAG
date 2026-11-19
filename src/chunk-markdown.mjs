// chunk-markdown.mjs — heading-aware chunking for chunk-strategy "markdown".
//
// Contract: pure. A document is split at every ATX heading into sections;
// each chunk carries its heading path (the enclosing headings, outermost
// first: ["About", "Contact"]). A section that holds only its heading is
// carried into the next section rather than dropped. A section larger than
// maxChunkBytes is packed greedily from its blocks (src/markdown-blocks.mjs)
// so boundaries fall between paragraphs; fenced code, tables and front
// matter are never split, and one larger than maxChunkBytes fails naming the
// file, line and sizes. An oversized paragraph is split at line boundaries,
// then at whitespace, then (for one huge word) at code-point boundaries.
// Chunk text is the exact source line slice [startLine, endLine] (1-based),
// except for the pieces of a paragraph line split below line granularity.

import { parseBlocks } from './markdown-blocks.mjs';

/** @typedef {{startLine: number, endLine: number, text: string, headingPath: string[]}} MarkdownChunk */

const ATOMIC = { fence: 'a fenced code block', table: 'a table', front: 'front matter' };

const bytes = (s) => Buffer.byteLength(s, 'utf8');

/** Group blocks into sections at headings; heading-only sections carry forward. */
function sections(blocks) {
  const out = [];
  const stack = [];
  let current = { blocks: [], path: [] };
  let carried = [];
  const close = () => {
    const hasBody = current.blocks.some((b) => b.kind !== 'heading');
    if (hasBody) {
      out.push({ blocks: [...carried, ...current.blocks], path: current.path });
      carried = [];
    } else {
      carried.push(...current.blocks);
    }
  };
  for (const b of blocks) {
    if (b.kind === 'heading') {
      close();
      while (stack.length > 0 && stack.at(-1).level >= b.level) stack.pop();
      stack.push({ level: b.level, title: b.title });
      current = { blocks: [b], path: stack.map((s) => s.title) };
    } else {
      current.blocks.push(b);
    }
  }
  close();
  if (carried.length > 0) out.push({ blocks: carried, path: current.path });
  return out;
}

/** Split one over-long line at whitespace, then code points, into pieces <= max bytes. */
function splitLine(line, max) {
  const pieces = [];
  let cur = '';
  for (const word of line.trim().split(/\s+/)) {
    const joined = cur === '' ? word : `${cur} ${word}`;
    if (bytes(joined) <= max) {
      cur = joined;
      continue;
    }
    if (cur !== '') pieces.push(cur);
    cur = '';
    let rest = word;
    while (bytes(rest) > max) {
      let piece = '';
      for (const ch of rest) {
        if (bytes(piece + ch) > max) break;
        piece += ch;
      }
      pieces.push(piece);
      rest = rest.slice(piece.length);
    }
    cur = rest;
  }
  if (cur !== '') pieces.push(cur);
  return pieces;
}

/**
 * @param {string} text
 * @param {{maxChunkBytes: number, path: string}} opts  path names the file in errors
 * @returns {MarkdownChunk[]}
 */
export function chunkMarkdown(text, { maxChunkBytes, path }) {
  const lines = text.split('\n');
  const slice = (a, b) => lines.slice(a, b + 1).join('\n');
  const chunks = [];
  for (const { blocks, path: headingPath } of sections(parseBlocks(lines))) {
    const emit = (a, b, t = slice(a, b)) => chunks.push({ startLine: a + 1, endLine: b + 1, text: t, headingPath });
    const first = blocks[0].start;
    const last = blocks.at(-1).end;
    if (bytes(slice(first, last)) <= maxChunkBytes) {
      emit(first, last);
      continue;
    }
    let open = null;
    const flush = () => {
      if (open) emit(open.start, open.end);
      open = null;
    };
    for (const b of blocks) {
      const size = bytes(slice(b.start, b.end));
      if (size > maxChunkBytes) {
        if (ATOMIC[b.kind]) {
          throw new Error(
            `${path}:${b.start + 1}: ${ATOMIC[b.kind]} of ${size} bytes exceeds max-chunk-bytes (${maxChunkBytes}); ` +
              'it is never split, so raise max-chunk-bytes or shorten it',
          );
        }
        flush();
        for (let i = b.start; i <= b.end; i++) {
          if (bytes(lines[i]) > maxChunkBytes) {
            flush();
            for (const piece of splitLine(lines[i], maxChunkBytes)) emit(i, i, piece);
          } else if (open && bytes(slice(open.start, i)) <= maxChunkBytes) {
            open.end = i;
          } else {
            flush();
            open = { start: i, end: i };
          }
        }
        flush();
      } else if (open && bytes(slice(open.start, b.end)) <= maxChunkBytes) {
        open.end = b.end;
      } else {
        flush();
        open = { start: b.start, end: b.end };
      }
    }
    flush();
  }
  return chunks;
}
