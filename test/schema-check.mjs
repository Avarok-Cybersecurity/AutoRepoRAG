#!/usr/bin/env node
// schema-check.mjs — standalone lattice-jsonl v1 corpus validator.
//
// Usage: node test/schema-check.mjs <corpus.jsonl> [corpus.jsonl.gz] [meta.json]
//        (empty-string extra args are ignored — CI passes possibly-empty
//         step outputs; with 1 arg the .gz twin is auto-discovered)
//
// Deliberately imports NOTHING from src/ so it cannot inherit a serializer
// bug it is supposed to catch. Validates, failing fast (exit 1) with a
// precise message on the FIRST violation:
//   - header is line 1, exactly one header, recognized format/version
//   - every object's keys sorted lexicographically at every level (incl. "t")
//   - point ids strictly ascending
//   - header points/edges counts equal body counts
//   - every vector length == header dim, all components finite numbers
//   - every payload carries exactly the 8 required keys, correctly typed
//   - "labels" key absent from every point (writer emits corpus labels 0)
//   - the .gz twin (explicit arg, else discovered next to the file) gunzips
//     byte-identical
//   - meta.json (when given) agrees: sha256(corpus), dim, points

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const FORMAT = 'lattice-jsonl';
const FORMAT_VERSION = 1;
const REQUIRED_PAYLOAD_KEYS = [
  'chunk_hash', 'commit_sha', 'end_line', 'language', 'path', 'repo', 'start_line', 'text',
];
const PAYLOAD_TYPES = {
  chunk_hash: 'string', commit_sha: 'string', end_line: 'number', language: 'string',
  path: 'string', repo: 'string', start_line: 'number', text: 'string',
};

function usage(stream) {
  stream.write(
    'usage: node test/schema-check.mjs <corpus.jsonl> [corpus.jsonl.gz] [meta.json]\n\n' +
      'Validates a lattice-jsonl v1 corpus: header-first, sorted keys at every\n' +
      'level, strictly ascending ids, header/body count agreement, per-vector\n' +
      'dim, payload schema, labels omission, and .gz twin byte-fidelity.\n' +
      'With a .gz arg that exact file must gunzip byte-identical (1-arg mode\n' +
      'auto-discovers <corpus>.gz); with a meta.json arg its sha256/dim/points\n' +
      'must agree with the corpus. Empty-string args are treated as absent.\n' +
      'Exits 0 on a valid corpus, 1 on the first violation, 2 on bad usage.\n',
  );
}

function fail(msg) {
  process.stderr.write(`schema-check: FAIL: ${msg}\n`);
  process.exit(1);
}

/** Recursively assert Object.keys order is strictly ascending (code-unit order). */
function checkSortedKeys(value, where) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => checkSortedKeys(v, `${where}[${i}]`));
    return;
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value);
    for (let i = 1; i < keys.length; i++) {
      if (!(keys[i - 1] < keys[i])) {
        fail(`${where}: keys not sorted lexicographically ("${keys[i - 1]}" appears before "${keys[i]}")`);
      }
    }
    for (const k of keys) checkSortedKeys(value[k], `${where}.${JSON.stringify(k)}`);
  }
}

function checkHeader(obj, where) {
  if (obj.format !== FORMAT) fail(`${where}: format is ${JSON.stringify(obj.format)}, expected "${FORMAT}"`);
  if (obj.version !== FORMAT_VERSION) fail(`${where}: version is ${JSON.stringify(obj.version)}, expected ${FORMAT_VERSION}`);
  if (obj.vectors !== 'inline') fail(`${where}: vectors is ${JSON.stringify(obj.vectors)}, expected "inline"`);
  if (!Number.isInteger(obj.dim) || obj.dim < 1) fail(`${where}: dim ${JSON.stringify(obj.dim)} is not an integer >= 1`);
  if (!Number.isInteger(obj.points) || obj.points < 0) fail(`${where}: points ${JSON.stringify(obj.points)} is not an integer >= 0`);
  if (!Number.isInteger(obj.edges) || obj.edges < 0) fail(`${where}: edges ${JSON.stringify(obj.edges)} is not an integer >= 0`);
  if (obj.config === null || typeof obj.config !== 'object') fail(`${where}: config is missing or not an object`);
  if (obj.config?.vectors?.size !== obj.dim) {
    fail(`${where}: config.vectors.size ${JSON.stringify(obj.config?.vectors?.size)} != dim ${obj.dim}`);
  }
}

function checkPoint(obj, where, dim, lastId) {
  if (!Number.isSafeInteger(obj.id)) fail(`${where}: id ${JSON.stringify(obj.id)} is not an integer`);
  if (lastId !== null && obj.id <= lastId) {
    fail(`${where}: id ${obj.id} not strictly ascending (previous id ${lastId})`);
  }
  if ('labels' in obj) fail(`${where}: "labels" key present (must be omitted when 0)`);
  if (!Array.isArray(obj.vector)) fail(`${where}: vector missing or not an array`);
  if (obj.vector.length !== dim) fail(`${where}: vector length ${obj.vector.length} != header dim ${dim}`);
  for (let i = 0; i < obj.vector.length; i++) {
    const x = obj.vector[i];
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      fail(`${where}: vector[${i}] is ${JSON.stringify(x)}, not a finite number`);
    }
  }
  const payload = obj.payload;
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    fail(`${where}: payload missing or not an object`);
  }
  const keys = Object.keys(payload);
  if (keys.length !== REQUIRED_PAYLOAD_KEYS.length || REQUIRED_PAYLOAD_KEYS.some((k, i) => keys[i] !== k)) {
    fail(
      `${where}: payload keys [${keys.join(',')}] != required sorted set [${REQUIRED_PAYLOAD_KEYS.join(',')}]`,
    );
  }
  for (const [k, t] of Object.entries(PAYLOAD_TYPES)) {
    if (typeof payload[k] !== t) fail(`${where}: payload.${k} is ${typeof payload[k]}, expected ${t}`);
  }
  if (!Number.isInteger(payload.start_line) || payload.start_line < 1) {
    fail(`${where}: payload.start_line ${JSON.stringify(payload.start_line)} is not an integer >= 1`);
  }
  if (!Number.isInteger(payload.end_line) || payload.end_line < payload.start_line) {
    fail(`${where}: payload.end_line ${JSON.stringify(payload.end_line)} < start_line ${payload.start_line}`);
  }
  return obj.id;
}

function checkEdge(obj, where, lastEdge) {
  for (const k of ['from', 'to']) {
    if (!Number.isSafeInteger(obj[k])) fail(`${where}: edge ${k} ${JSON.stringify(obj[k])} is not an integer`);
  }
  if (typeof obj.rel !== 'string') fail(`${where}: edge rel is not a string`);
  if (lastEdge !== null) {
    const cmp =
      obj.from - lastEdge.from ||
      (obj.rel < lastEdge.rel ? -1 : obj.rel > lastEdge.rel ? 1 : 0) ||
      obj.to - lastEdge.to;
    if (cmp <= 0) fail(`${where}: edges not sorted by (from, rel, to)`);
  }
  return { from: obj.from, rel: obj.rel, to: obj.to };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    usage(process.stdout);
    process.exit(0);
  }
  if (args.length < 1 || args.length > 3) {
    usage(process.stderr);
    process.exit(2);
  }
  // CI forwards step outputs verbatim; corpus-gz-file is '' when gzip=false.
  const [file, gzArg = '', metaArg = ''] = args;
  if (!existsSync(file)) fail(`no such file: ${file}`);
  const raw = readFileSync(file);
  if (raw.length === 0) fail(`${file} is empty`);
  if (raw[raw.length - 1] !== 0x0a) fail(`${file} does not end with a newline`);

  const text = raw.toString('utf8');
  const lines = text.split('\n');
  lines.pop(); // trailing newline -> final empty element
  if (lines.length === 0) fail(`${file} has no content lines`);

  let header = null;
  let pointCount = 0;
  let edgeCount = 0;
  let lastId = null;
  let lastEdge = null;

  for (let n = 0; n < lines.length; n++) {
    const where = `line ${n + 1}`;
    const line = lines[n];
    if (line === '') fail(`${where}: blank line inside corpus`);
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (e) {
      fail(`${where}: invalid JSON (${e.message})`);
    }
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      fail(`${where}: not a JSON object`);
    }
    checkSortedKeys(obj, where);
    if (n === 0) {
      if (obj.t !== 'header') fail(`${where}: first line has t=${JSON.stringify(obj.t)}, expected "header"`);
      checkHeader(obj, where);
      header = obj;
      continue;
    }
    if (obj.t === 'header') fail(`${where}: second header`);
    if (obj.t === 'point') {
      if (edgeCount > 0) fail(`${where}: point after edges (points must precede edges)`);
      lastId = checkPoint(obj, where, header.dim, lastId);
      pointCount += 1;
    } else if (obj.t === 'edge') {
      lastEdge = checkEdge(obj, where, lastEdge);
      edgeCount += 1;
    } else {
      fail(`${where}: unknown tag t=${JSON.stringify(obj.t)}`);
    }
  }

  if (pointCount !== header.points) fail(`header declares ${header.points} points, body has ${pointCount}`);
  if (edgeCount !== header.edges) fail(`header declares ${header.edges} edges, body has ${edgeCount}`);

  const gzTwin = gzArg || `${file}.gz`;
  let gzNote = 'no .gz twin';
  if (gzArg && !existsSync(gzTwin)) fail(`no such gz file: ${gzTwin}`);
  if (existsSync(gzTwin)) {
    let inflated;
    try {
      inflated = gunzipSync(readFileSync(gzTwin));
    } catch (e) {
      fail(`${gzTwin}: gunzip failed (${e.message})`);
    }
    if (!inflated.equals(raw)) {
      fail(`${gzTwin} gunzips to ${inflated.length} bytes that differ from ${file} (${raw.length} bytes)`);
    }
    gzNote = `.gz twin byte-identical (${readFileSync(gzTwin).length} B)`;
  }

  let metaNote = 'no meta.json given';
  if (metaArg) {
    if (!existsSync(metaArg)) fail(`no such meta file: ${metaArg}`);
    let meta;
    try {
      meta = JSON.parse(readFileSync(metaArg, 'utf8'));
    } catch (e) {
      fail(`${metaArg}: invalid JSON (${e.message})`);
    }
    const sha256 = createHash('sha256').update(raw).digest('hex');
    if (meta.sha256 !== sha256) {
      fail(`${metaArg}: sha256 ${JSON.stringify(meta.sha256)} != corpus sha256 ${sha256}`);
    }
    if (meta.dim !== header.dim) {
      fail(`${metaArg}: dim ${JSON.stringify(meta.dim)} != corpus header dim ${header.dim}`);
    }
    if (meta.points !== pointCount) {
      fail(`${metaArg}: points ${JSON.stringify(meta.points)} != corpus point count ${pointCount}`);
    }
    metaNote = `meta.json agrees (sha256, dim, points)`;
  }

  process.stdout.write(
    `schema-check: OK: ${file} — ${pointCount} points, ${edgeCount} edges, dim ${header.dim}, ` +
      `sorted keys at every level, ids strictly ascending, ${gzNote}, ${metaNote}\n`,
  );
}

main();
