// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// validate.js — the openRepoChat(config) contract. Pure: no DOM, no network.
//
// Every key is required; there are no defaults. `mode` decides which keys
// exist: answer mode has provider/retrieval, search mode has search. One call reports EVERY
// problem at once (a missing parent lists each of its missing leaves), so a
// site author fixes the config in one pass instead of one error per reload.
// Unknown keys are refused too: a typo would otherwise be silently ignored.
//
// Not configuration, on purpose: the embedding model. It is read from each
// corpus's meta.json at load, because a different embedder would not match
// the vectors the corpus was built with (see core/manifest.js).
// =============================================================================

import { COPY_EN } from '../copy-en.js';
import { THEME_KEYS } from '../core/theme.js';

export class ConfigError extends Error {
  constructor(problems) {
    super(`openRepoChat: invalid config (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

const CORPUS_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const KEY_PREFIX = /^[A-Za-z0-9._-]{1,64}$/;
const HTTP_URL = /^https?:\/\/[^\s/]+/;
const PLACEHOLDER = /\{(\w+)\}/g;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

// --- leaf checks: each returns null when valid, else what is wrong ----------

const nonEmptyString = (v) => (typeof v === 'string' && v.trim() !== '' ? null : 'must be a non-empty string');

const httpUrl = (v) => nonEmptyString(v) ?? (HTTP_URL.test(v) ? null : 'must be an absolute http(s) URL');

const integerAtLeast = (min) => (v) => (Number.isSafeInteger(v) && v >= min ? null : `must be an integer >= ${min}`);

const keyPrefix = (v) => (typeof v === 'string' && KEY_PREFIX.test(v) ? null : 'must be 1-64 characters of [A-Za-z0-9._-]');

const svgOrNull = (v) => {
  if (v === null) return null;
  if (typeof v === 'string' && /^\s*<svg[\s>]/.test(v) && /<\/svg>\s*$/.test(v)) return null;
  return 'must be null (no watermark) or a complete <svg>...</svg> string';
};

// Duck-typed so the validator stays pure: an Element node is nodeType 1.
const element = (v) => (v !== null && typeof v === 'object' && v.nodeType === 1 && typeof v.appendChild === 'function' ? null : 'must be a DOM Element');

const fn = (v) => (typeof v === 'function' ? null : 'must be a function');

// --- spec -------------------------------------------------------------------

const leaf = (check) => ({ kind: 'leaf', check });
const optional = (check) => ({ kind: 'leaf', check, optional: true });
const object = (fields) => ({ kind: 'object', fields });
// A key whose shape depends on the mode: not judged while the mode is unknown.
const SKIP = { kind: 'skip' };

const corpusId = leaf((v) => (typeof v === 'string' && CORPUS_ID.test(v) ? null : 'must match /^[a-z0-9][a-z0-9_-]{0,63}$/'));
const corpora = (urlKey) => ({ kind: 'corpora', shape: `{ id, ${urlKey}, metaUrl }`, entry: object({ id: corpusId, [urlKey]: leaf(nonEmptyString), metaUrl: leaf(nonEmptyString) }) });

const embedder = {
  kind: 'nullable',
  what: 'null or { model, dim, embed }',
  spec: object({ model: leaf(nonEmptyString), dim: leaf(integerAtLeast(1)), embed: leaf(fn) }),
};

const MODES = ['answer', 'search'];
const modeLeaf = {
  kind: 'leaf',
  check: (v) => (MODES.includes(v) ? null : `must be one of ${MODES.map((m) => `'${m}'`).join(', ')}`),
  missing: `missing (one of ${MODES.map((m) => `'${m}'`).join(', ')})`,
};

/** Keys every mode has, with one shape. */
const SHARED = {
  mode: modeLeaf,
  mount: leaf(element),
  assets: object({ cssHref: leaf(nonEmptyString) }),
  wasm: object({ jsUrl: leaf(nonEmptyString), binUrl: leaf(nonEmptyString) }),
  storage: object({ keyPrefix: leaf(keyPrefix) }),
  copy: { kind: 'copy' },
  theme: object(Object.fromEntries(THEME_KEYS.map((k) => [k, leaf(nonEmptyString)]))),
  onReady: optional(fn),
  onClose: optional(fn),
};

const SPECS = {
  answer: object({
    ...SHARED,
    corpora: corpora('gzUrl'),
    provider: object({
      apiUrl: leaf(httpUrl),
      rerankModel: leaf(nonEmptyString),
      chatModel: leaf(nonEmptyString),
      appTitle: leaf(nonEmptyString),
      referer: leaf(httpUrl),
      maxAttempts: leaf(integerAtLeast(1)),
      retryBaseMs: leaf(integerAtLeast(0)),
    }),
    retrieval: object({
      topK: leaf(integerAtLeast(1)),
      rerankMultiplier: leaf(integerAtLeast(1)),
      upsertBatch: leaf(integerAtLeast(1)),
    }),
    brand: object({ productName: leaf(nonEmptyString), motifSvg: leaf(svgOrNull) }),
  }),
  search: object({
    ...SHARED,
    corpora: corpora('snapshotUrl'),
    search: object({ topK: leaf(integerAtLeast(1)), snippetChars: leaf(integerAtLeast(40)), embedder }),
    brand: object({ motifSvg: leaf(svgOrNull) }),
  }),
};

// The mode is missing or unknown: report it and the shared keys, nothing more.
const MODELESS = object({ ...SHARED, corpora: SKIP, provider: SKIP, retrieval: SKIP, search: SKIP, brand: SKIP });

// --- walkers ----------------------------------------------------------------

function walk(spec, value, path, problems) {
  if (spec.kind === 'skip') return;
  if (spec.kind === 'leaf') {
    if (value === undefined) {
      if (!spec.optional) problems.push(`${path}: ${spec.missing ?? 'missing'}`);
      return;
    }
    const why = spec.check(value);
    if (why) problems.push(`${path}: ${why}`);
    return;
  }
  if (spec.kind === 'corpora') return checkCorpora(spec, value, path, problems);
  if (spec.kind === 'copy') return checkCopy(COPY_EN, value, path, problems);
  if (spec.kind === 'nullable') {
    if (value === undefined) problems.push(`${path}: missing (${spec.what})`);
    else if (value !== null && !isPlainObject(value)) problems.push(`${path}: must be ${spec.what}`);
    else if (value !== null) walk(spec.spec, value, path, problems);
    return;
  }

  if (value !== undefined && !isPlainObject(value)) {
    problems.push(`${path}: must be an object`);
    value = undefined;
  }
  const obj = value ?? {};
  for (const [key, child] of Object.entries(spec.fields)) {
    walk(child, obj[key], path ? `${path}.${key}` : key, problems);
  }
  for (const key of Object.keys(obj)) {
    if (!(key in spec.fields)) problems.push(`${path ? `${path}.` : ''}${key}: unknown key`);
  }
}

function checkCorpora(spec, value, path, problems) {
  if (value === undefined) {
    problems.push(`${path}: missing (a non-empty array of ${spec.shape})`);
    return;
  }
  if (!Array.isArray(value) || value.length === 0) {
    problems.push(`${path}: must be a non-empty array of ${spec.shape}`);
    return;
  }
  const seen = new Set();
  value.forEach((corpus, i) => {
    const at = `${path}[${i}]`;
    walk(spec.entry, corpus, at, problems);
    const id = isPlainObject(corpus) ? corpus.id : undefined;
    if (typeof id === 'string') {
      if (seen.has(id)) problems.push(`${at}.id: duplicate corpus id ${JSON.stringify(id)}`);
      seen.add(id);
    }
  });
}

/** The placeholders a template string names, in order of appearance. */
function placeholders(text) {
  return [...text.matchAll(PLACEHOLDER)].map((m) => m[1]);
}

/** config.copy must mirror COPY_EN's shape exactly. */
function checkCopy(reference, value, path, problems) {
  if (value === undefined) {
    problems.push(`${path}: missing (start from COPY_EN: { ...COPY_EN, ... })`);
    return;
  }
  if (typeof reference === 'string') {
    const why = nonEmptyString(value);
    if (why) {
      problems.push(`${path}: ${why}`);
      return;
    }
    const allowed = new Set(placeholders(reference));
    for (const name of placeholders(value)) {
      if (!allowed.has(name)) problems.push(`${path}: unknown placeholder {${name}} (allowed: ${[...allowed].map((a) => `{${a}}`).join(' ') || 'none'})`);
    }
    return;
  }
  if (Array.isArray(reference)) {
    if (!Array.isArray(value) || value.some((v) => nonEmptyString(v) !== null)) {
      problems.push(`${path}: must be an array of non-empty strings`);
    }
    return;
  }
  if (!isPlainObject(value)) {
    problems.push(`${path}: must be an object`);
    return;
  }
  for (const [key, ref] of Object.entries(reference)) {
    checkCopy(ref, value[key], `${path}.${key}`, problems);
  }
  for (const key of Object.keys(value)) {
    if (!(key in reference)) problems.push(`${path}.${key}: unknown key`);
  }
}

/**
 * Validate an openRepoChat/warmRepoChat config. `mode` picks the contract:
 * 'answer' (corpora of .jsonl.gz, OpenRouter answers) or 'search' (corpora of
 * LatticeDB snapshots, a ranked result list, no key). Returns it unchanged when
 * valid; otherwise throws one ConfigError whose message lists every problem.
 */
export function validateConfig(config) {
  const problems = [];
  if (!isPlainObject(config)) problems.push('config: must be a plain object');
  const value = isPlainObject(config) ? config : undefined;
  walk(Object.hasOwn(SPECS, value?.mode) ? SPECS[value.mode] : MODELESS, value, '', problems);
  if (problems.length > 0) throw new ConfigError(problems);
  return config;
}
