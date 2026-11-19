// sidecar.mjs — merge the payload-sidecar into chunk payloads.
//
// Contract: pure. The sidecar is a JSON object mapping a file path (relative
// to the chunked root, as chunk payloads spell it) to an object of extra
// payload fields, e.g. {"about/index.md": {"url": "...", "title": "About"}}.
// Every chunk of that file gets those fields. A key naming a file that is not
// in the corpus is an error (a typo would otherwise drop a page's url
// silently), and so is a field the action itself writes. Files without an
// entry keep their payload.

/** Payload fields the action writes; a sidecar may not replace them. */
export const RESERVED_PAYLOAD_KEYS = Object.freeze([
  'chunk_hash', 'commit_sha', 'end_line', 'heading_path', 'language', 'path', 'repo', 'start_line', 'text',
]);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * @template {{path: string, payload: Record<string, unknown>}} C
 * @param {C[]} chunks
 * @param {unknown} sidecar  parsed JSON
 * @returns {C[]}  new chunk objects (inputs untouched)
 */
export function mergeSidecar(chunks, sidecar) {
  if (!isPlainObject(sidecar)) throw new Error('payload-sidecar must be a JSON object of {"<path>": {...}}');
  const corpusPaths = new Set(chunks.map((c) => c.path));
  const unknown = Object.keys(sidecar).filter((p) => !corpusPaths.has(p)).sort();
  if (unknown.length > 0) {
    const shown = unknown.slice(0, 10).map((p) => JSON.stringify(p)).join(', ');
    throw new Error(
      `payload-sidecar names ${unknown.length} file(s) not in the corpus: ${shown}${unknown.length > 10 ? ', ...' : ''} ` +
        '(not matched by paths/exclude, binary, empty, or cut by max-chunks)',
    );
  }
  for (const [path, extra] of Object.entries(sidecar)) {
    const where = `payload-sidecar[${JSON.stringify(path)}]`;
    if (!isPlainObject(extra)) throw new Error(`${where} must be a JSON object`);
    for (const key of Object.keys(extra)) {
      if (RESERVED_PAYLOAD_KEYS.includes(key)) {
        throw new Error(`${where}.${key} would overwrite a payload field the action writes; rename it`);
      }
    }
  }
  return chunks.map((c) => {
    const extra = Object.hasOwn(sidecar, c.path) ? sidecar[c.path] : null;
    return extra ? { ...c, payload: { ...c.payload, ...extra } } : c;
  });
}
