// embed.mjs — embedding providers: deterministic mock + live OpenRouter-compatible client.
//
// Contract: mock vectors are seeded from sha256 of the chunk TEXT and iterate sha256
// to fill dim floats in [-1, 1], L2-normalized — deterministic forever. The
// live client mirrors lattice-db/examples/rag-example/src/openrouter.ts:
// batch POST /embeddings, results sorted by index, dim derived from the first
// response with per-vector length assertions, retries with 700ms * 2^n backoff
// on 429/5xx AND on HTTP-200-with-error bodies matching transient patterns,
// and a fixed pacing interval between request starts.

import { sha256Bytes, sleep, log } from './util.mjs';

// ---------------------------------------------------------------------------
// Mock mode

/**
 * Deterministic unit vector for a chunk hash. Byte stream: d0 = sha256(hash),
 * d(n+1) = sha256(d(n)), concatenated; float i = bytes[4i..4i+4] as u32 BE
 * mapped to [-1, 1]; then L2-normalized. Quantization (significant digits +
 * fround) is the caller's job so mock and live vectors share one pipeline.
 */
export function mockEmbedding(seedText, dim) {
  let digest = sha256Bytes(seedText);
  const pool = [digest];
  let bytes = digest.length;
  const needed = dim * 4;
  while (bytes < needed) {
    digest = sha256Bytes(digest);
    pool.push(digest);
    bytes += digest.length;
  }
  const buf = Buffer.concat(pool);
  const v = new Array(dim);
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    const x = (buf.readUInt32BE(i * 4) / 0xffffffff) * 2 - 1;
    v[i] = x;
    sumSq += x * x;
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) throw new Error('mock embedding has zero norm');
  for (let i = 0; i < dim; i++) v[i] /= norm;
  return v;
}

// ---------------------------------------------------------------------------
// Live mode

const TRANSIENT_MESSAGE = /ResourceExhausted|rate.?limit|overloaded/i;

class TransientAwareError extends Error {
  constructor(message, transient) {
    super(message);
    this.name = 'EmbeddingError';
    this.transient = transient;
  }
}

/**
 * Parse an OpenRouter-style response. Upstream failures can arrive as HTTP 200
 * with an `error` body (common on saturated free-tier providers), so every
 * response funnels through here.
 */
async function parseResponse(response, what) {
  const raw = await response.text();
  if (!response.ok) {
    throw new TransientAwareError(
      `${what} failed: HTTP ${response.status} - ${raw.slice(0, 500)}`,
      response.status === 429 || response.status >= 500,
    );
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new TransientAwareError(`${what} returned invalid JSON: ${raw.slice(0, 200)}`, false);
  }
  if (data && typeof data === 'object' && data.error) {
    const code = data.error.code ?? 0;
    // Providers send codes as numbers (429) or strings ("429", "rate_limited").
    const codeNum = typeof code === 'string' ? Number(code) : code;
    const message = data.error.message ?? 'unknown error';
    throw new TransientAwareError(
      `${what} failed${code ? ` (${code})` : ''}: ${message}`,
      codeNum === 429 || codeNum >= 500 || TRANSIENT_MESSAGE.test(message),
    );
  }
  return data;
}

const RETRY_BASE_MS = 700;

async function withRetry(operation, maxAttempts) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const transient = error instanceof TransientAwareError && error.transient;
      if (!transient || attempt === maxAttempts) break;
      const backoff = RETRY_BASE_MS * 2 ** (attempt - 1);
      log(`[embed] transient failure (attempt ${attempt}/${maxAttempts}), retrying in ${backoff}ms: ${error.message}`);
      await sleep(backoff);
    }
  }
  throw lastError;
}

/** One embeddings request. Returns vectors in input order. */
export async function embedBatchLive(texts, { endpoint, model, apiKey, maxRetries }) {
  if (texts.length === 0) return [];
  const base = endpoint.replace(/\/+$/, '');
  const data = await withRetry(async () => {
    const response = await fetch(`${base}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'AutoRepoRAG',
      },
      body: JSON.stringify({ model, input: texts }),
    });
    return parseResponse(response, 'Embedding request');
  }, maxRetries);
  if (!Array.isArray(data?.data) || data.data.length !== texts.length) {
    throw new Error(
      `Embedding response has ${data?.data?.length ?? 'no'} items for ${texts.length} inputs`,
    );
  }
  return data.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/**
 * Embed all texts: batches of batchSize, request starts paced at least
 * requestIntervalMs apart (retries included in pacing). Dim is derived from
 * the first returned vector; every vector's length is asserted against it.
 * Returns { vectors, dim }.
 */
export async function embedTexts(texts, opts) {
  const { batchSize, requestIntervalMs } = opts;
  const vectors = [];
  let dim = 0;
  let nextAllowedAt = 0;
  const totalBatches = Math.ceil(texts.length / batchSize);
  for (let b = 0; b < totalBatches; b++) {
    const batch = texts.slice(b * batchSize, (b + 1) * batchSize);
    const wait = nextAllowedAt - Date.now();
    if (wait > 0) await sleep(wait);
    nextAllowedAt = Date.now() + requestIntervalMs;
    const got = await embedBatchLive(batch, opts);
    for (const vec of got) {
      if (!Array.isArray(vec) || vec.length === 0) {
        throw new Error('Embedding response contained an empty vector');
      }
      if (dim === 0) dim = vec.length;
      if (vec.length !== dim) {
        throw new Error(`Embedding dimension drifted: got ${vec.length}, expected ${dim}`);
      }
      vectors.push(vec);
    }
    log(`[embed] batch ${b + 1}/${totalBatches} done (${vectors.length}/${texts.length} vectors, dim ${dim})`);
  }
  return { vectors, dim };
}
