// markdown-blocks.mjs — split markdown source lines into atomic blocks.
//
// Contract: pure. A block is a run of lines that a chunk boundary may fall
// before or after but never inside: an ATX heading line, a fenced code block
// (``` or ~~~, closed only by the same character at least as long; an
// unclosed fence runs to the end), a GFM table (a header row with a pipe, a
// delimiter row, then every following non-blank line with a pipe), leading
// YAML front matter (--- ... ---), or a paragraph (consecutive non-blank
// lines that start none of the above). Blank lines separate blocks and
// belong to none. Setext headings are not recognised (their text stays in
// the paragraph). Line indexes are 0-based and inclusive.

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;
const TABLE_DELIMITER = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;

/** @typedef {'heading'|'fence'|'table'|'front'|'para'} BlockKind */
/** @typedef {{kind: BlockKind, start: number, end: number, level: number, title: string}} Block */

const blank = (line) => line.trim() === '';

/** Heading text as a reader sees it: no closing hashes, link syntax or emphasis markers. */
export function headingTitle(raw) {
  return raw
    .replace(/(?:^|[ \t]+)#+[ \t]*$/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fenceEnd(lines, start, marker) {
  for (let i = start + 1; i < lines.length; i++) {
    const m = FENCE_CLOSE.exec(lines[i]);
    if (m && m[1][0] === marker[0] && m[1].length >= marker.length) return i;
  }
  let end = lines.length - 1;
  while (end > start && blank(lines[end])) end -= 1;
  return end;
}

function isTableStart(lines, i) {
  return lines[i].includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && TABLE_DELIMITER.test(lines[i + 1]);
}

function tableEnd(lines, start) {
  let i = start + 1;
  while (i + 1 < lines.length && !blank(lines[i + 1]) && lines[i + 1].includes('|')) i += 1;
  return i;
}

function frontMatterEnd(lines) {
  if (lines[0] !== '---') return -1;
  for (let i = 1; i < lines.length; i++) if (lines[i] === '---' || lines[i] === '...') return i;
  return -1;
}

/** True when line i begins a block other than a paragraph (so it ends a paragraph). */
function startsBlock(lines, i) {
  return HEADING.test(lines[i]) || FENCE_OPEN.test(lines[i]) || isTableStart(lines, i);
}

/**
 * @param {string[]} lines  source lines (no trailing newline characters)
 * @returns {Block[]}
 */
export function parseBlocks(lines) {
  const blocks = [];
  const push = (kind, start, end, level = 0, title = '') => blocks.push({ kind, start, end, level, title });
  let i = 0;
  const front = frontMatterEnd(lines);
  if (front > 0) {
    push('front', 0, front);
    i = front + 1;
  }
  while (i < lines.length) {
    const line = lines[i];
    if (blank(line)) {
      i += 1;
      continue;
    }
    const heading = HEADING.exec(line);
    const fence = FENCE_OPEN.exec(line);
    let end;
    if (heading) {
      push('heading', i, i, heading[1].length, headingTitle(heading[2] ?? ''));
      end = i;
    } else if (fence) {
      end = fenceEnd(lines, i, fence[1]);
      push('fence', i, end);
    } else if (isTableStart(lines, i)) {
      end = tableEnd(lines, i);
      push('table', i, end);
    } else {
      end = i;
      while (end + 1 < lines.length && !blank(lines[end + 1]) && !startsBlock(lines, end + 1)) end += 1;
      push('para', i, end);
    }
    i = end + 1;
  }
  return blocks;
}
