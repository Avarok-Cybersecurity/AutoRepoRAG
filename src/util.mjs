// util.mjs — shared primitives for AutoRepoRAG.
//
// Contract: byte-deterministic sorted-key JSON serialization (matches Rust
// serde_json + sort_keys in lattice-core's interchange/jsonl.rs for ASCII
// keys), sha256 helpers, glob matching (** / * / ? plus {a,b} expansion),
// float quantization (N significant digits, then f32 via Math.fround),
// gzip/gunzip, and GitHub Actions input/log helpers. Zero dependencies;
// Node 18 and 20 compatible.

import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync, constants as zlibConstants } from 'node:zlib';
import { appendFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Deterministic JSON

/** Compare two strings by their UTF-8 byte sequences (Rust String ordering). */
function compareUtf8(a, b) {
  return Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

/**
 * JSON.stringify with every object's keys sorted at every nesting level by
 * their UTF-8 bytes — exactly Rust's String (BTreeMap) ordering, so the
 * output byte-matches serde_json + sorted keys even for non-ASCII keys.
 * Refuses non-plain objects (Date/Map/Set/class instances): JSON.stringify
 * would silently mangle them into "{}" or a bare string.
 */
export function stableStringify(value) {
  if (value === undefined) {
    throw new Error('stableStringify: undefined is not serializable');
  }
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`stableStringify: non-finite number ${value}`);
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    throw new Error(
      `stableStringify: refusing non-plain object (prototype ${proto?.constructor?.name ?? 'unknown'})`,
    );
  }
  const keys = Object.keys(value).sort(compareUtf8);
  const parts = [];
  for (const k of keys) {
    const v = value[k];
    if (v === undefined) continue; // match JSON.stringify: skip undefined members
    parts.push(`${JSON.stringify(k)}:${stableStringify(v)}`);
  }
  return `{${parts.join(',')}}`;
}

// ---------------------------------------------------------------------------
// Hashing

/** sha256 of a string or Buffer, as a Buffer. */
export function sha256Bytes(data) {
  return createHash('sha256').update(data).digest();
}

/** sha256 of a string or Buffer, as lowercase hex. */
export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

// ---------------------------------------------------------------------------
// Globs

/** Expand {a,b,c} alternations into plain globs. Nested braces supported. */
export function expandBraces(glob) {
  const m = /\{([^{}]*)\}/.exec(glob);
  if (!m) return [glob];
  const out = [];
  for (const alt of m[1].split(',')) {
    const expanded = glob.slice(0, m.index) + alt + glob.slice(m.index + m[0].length);
    out.push(...expandBraces(expanded));
  }
  return out;
}

const REGEX_SPECIALS = new Set('\\^$.|+()[]{}'.split(''));

/**
 * Compile one brace-free glob to an anchored RegExp over posix-relative paths:
 *   **  matches any number of path segments (including zero when written a/**\/b)
 *   *   matches within one segment
 *   ?   matches one non-separator character
 */
export function globToRegExp(glob) {
  let out = '';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        const atSegmentStart = i === 0 || glob[i - 1] === '/';
        if (atSegmentStart && glob[i + 2] === '/') {
          out += '(?:[^/]+/)*'; // zero or more whole segments
          i += 3;
        } else {
          out += '.*';
          i += 2;
        }
      } else {
        out += '[^/]*';
        i += 1;
      }
    } else if (c === '?') {
      out += '[^/]';
      i += 1;
    } else {
      out += REGEX_SPECIALS.has(c) ? `\\${c}` : c;
      i += 1;
    }
  }
  return new RegExp(`^${out}$`);
}

/** Compile a list of globs (braces allowed) into a single path predicate. */
export function compileMatcher(globs) {
  const regexes = globs.flatMap(expandBraces).map(globToRegExp);
  return (path) => regexes.some((r) => r.test(path));
}

// ---------------------------------------------------------------------------
// Float quantization

/** Round to N significant digits (exact zero passes through). */
export function roundSig(x, digits) {
  if (!Number.isFinite(x)) throw new Error(`roundSig: non-finite value ${x}`);
  if (x === 0) return 0;
  return Number(x.toPrecision(digits));
}

/**
 * Quantize a vector for both upsert and export: N significant digits, then
 * cast through f32 so the exported file agrees bit-for-bit with what the
 * server (which stores f32) hands back on scroll.
 */
export function quantizeVector(vec, sigDigits) {
  return vec.map((v) => Math.fround(roundSig(v, sigDigits)));
}

/**
 * Format a finite f64 exactly as Rust serde_json (ryu::Buffer::format_finite)
 * prints it, so exported vector components byte-match lattice-core's export.
 * Rules (verified empirically against serde_json 1.0.151, 2026-08-16):
 *   - shortest round-trip digits (toExponential() with no argument);
 *   - scientific notation iff the decimal exponent is < -5 or >= 16;
 *   - scientific exponent keeps an explicit sign for positives: "1e+16",
 *     negatives print "1.5e-6" (no zero-padding);
 *   - fixed-notation integral values get a ".0" suffix ("1.0", "5875930.0");
 *   - -0 prints "-0.0" (JSON.stringify would lose the sign).
 * PAYLOAD numbers must NOT go through this: Rust parses those as integers.
 */
export function formatRustF64(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`formatRustF64: not a finite number: ${v}`);
  }
  const neg = v < 0 || Object.is(v, -0);
  const abs = Math.abs(v);
  if (abs === 0) return neg ? '-0.0' : '0.0';
  const [mant, expStr] = abs.toExponential().split('e');
  const exp = Number(expStr);
  const digits = mant.replace('.', '');
  let out;
  if (exp < -5 || exp >= 16) {
    const tail = `e${exp >= 0 ? '+' : ''}${exp}`;
    out = digits.length === 1 ? `${digits}${tail}` : `${digits[0]}.${digits.slice(1)}${tail}`;
  } else if (exp < 0) {
    out = `0.${'0'.repeat(-exp - 1)}${digits}`;
  } else if (digits.length <= exp + 1) {
    out = `${digits}${'0'.repeat(exp + 1 - digits.length)}.0`;
  } else {
    out = `${digits.slice(0, exp + 1)}.${digits.slice(exp + 1)}`;
  }
  return neg ? `-${out}` : out;
}

// ---------------------------------------------------------------------------
// Compression

/** gzip at maximum compression (level 9). Node's gzip header carries mtime 0, so output is deterministic. */
export function gzip9(buf) {
  return gzipSync(buf, { level: zlibConstants.Z_BEST_COMPRESSION });
}

export function gunzip(buf) {
  return gunzipSync(buf);
}

export function isGzipBytes(buf) {
  return buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

// ---------------------------------------------------------------------------
// GitHub Actions input / logging helpers

export function inputEnvName(name) {
  return `INPUT_${name.replace(/-/g, '_').toUpperCase()}`;
}

/** Read a composite-action input mapped to INPUT_* by action.yml. Trimmed; '' when unset. */
export function getInput(name) {
  const v = process.env[inputEnvName(name)];
  return v === undefined ? '' : v.trim();
}

export function getRequiredInput(name) {
  const v = getInput(name);
  if (!v) throw new Error(`input "${name}" is required (env ${inputEnvName(name)} is empty)`);
  return v;
}

export function getBoolInput(name) {
  const v = getInput(name).toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  throw new Error(`input "${name}" must be "true" or "false", got ${JSON.stringify(getInput(name))}`);
}

export function getIntInput(name, { min, max }) {
  const raw = getInput(name);
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`input "${name}" must be a base-10 integer, got ${JSON.stringify(raw)}`);
  }
  const v = Number(raw);
  if (!Number.isSafeInteger(v)) {
    throw new Error(`input "${name}" must be a safe integer, got ${JSON.stringify(raw)}`);
  }
  if (v < min) throw new Error(`input "${name}" must be >= ${min}, got ${v}`);
  if (max !== undefined && v > max) {
    throw new Error(`input "${name}" must be <= ${max}, got ${v}`);
  }
  return v;
}

/**
 * Register a secret with the runner's log scrubber. Call before any other output.
 * Only the GitHub runner consumes `::add-mask::`; anywhere else the command would
 * itself PRINT the secret, so outside Actions this is a no-op.
 */
export function addMask(value) {
  if (value && process.env.GITHUB_ACTIONS === 'true') {
    process.stdout.write(`::add-mask::${value}\n`);
  }
}

export function warning(msg) {
  process.stdout.write(`::warning::${msg}\n`);
}

export function log(msg) {
  process.stdout.write(`${msg}\n`);
}

/** Append to the file named by a GitHub env var (GITHUB_OUTPUT / GITHUB_STEP_SUMMARY). Returns false when the env var is unset (local runs). */
export function appendGithubFile(envVar, text) {
  const path = process.env[envVar];
  if (!path) return false;
  appendFileSync(path, text);
  return true;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
