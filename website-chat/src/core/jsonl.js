// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// jsonl.js — lattice-jsonl line parsing for the streamed corpus. Pure: the
// loader feeds decoded text in, gets header/points out.
// =============================================================================

/**
 * Parse the header line. `expectedDim` is the manifest's dim (null when the
 * corpus is served from cache without one); a disagreement means the
 * published corpus and manifest are out of sync.
 */
export function parseHeader(line, expectedDim) {
  let h;
  try {
    h = JSON.parse(line);
  } catch {
    throw new Error('corpus is not lattice-jsonl (missing header line)');
  }
  if (h?.t !== 'header' || h?.format !== 'lattice-jsonl') {
    throw new Error('corpus is not lattice-jsonl (missing header line)');
  }
  if (!Number.isSafeInteger(h.dim) || h.dim < 1) {
    throw new Error('corpus header carries no valid dim');
  }
  if (expectedDim !== null && h.dim !== expectedDim) {
    throw new Error(`corpus header says ${h.dim} dimensions but the manifest says ${expectedDim} — the published corpus and manifest disagree`);
  }
  return h;
}

/** Parse a body line; non-point records (edges, future kinds) return null. */
export function parsePoint(line) {
  const p = JSON.parse(line);
  if (p?.t !== 'point') return null;
  return { id: p.id, vector: p.vector, payload: p.payload };
}

/**
 * Newline splitter over streamed text. `onLine` receives each complete,
 * non-blank, trimmed line; `end()` flushes a final line with no newline.
 * `push` returns after delivering every complete line so the caller can
 * flush batches between chunks.
 */
export function createLineSplitter(onLine) {
  let buf = '';
  return {
    async push(text) {
      buf += text;
      let nl;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (line !== '') await onLine(line);
      }
    },
    async end() {
      const line = buf.trim();
      buf = '';
      if (line !== '') await onLine(line);
    },
  };
}
