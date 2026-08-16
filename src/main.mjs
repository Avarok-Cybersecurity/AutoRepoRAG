// main.mjs — AutoRepoRAG orchestrator.
//
// Contract: reads composite-action inputs from INPUT_* env vars, provisions a
// pinned local lattice-server, chunks the repository, reuses vectors from a
// previous corpus (chunk_hash match, guarded by dim + model), embeds the rest
// (mock or live), quantizes every vector (significant digits + fround) BEFORE
// both upsert and export, loads + verifies the collection (points_count,
// 5-sample self-retrieval with cosine-distance <= 1e-3, scroll fidelity at
// 1e-6), writes the lattice-jsonl corpus + gzip -9 twin + meta.json, and
// emits GITHUB_OUTPUT / GITHUB_STEP_SUMMARY. Exits nonzero on any failure.

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  addMask, appendGithubFile, getBoolInput, getInput, getIntInput, getRequiredInput,
  gunzip, gzip9, isGzipBytes, log, quantizeVector, sha256Hex, warning,
} from './util.mjs';
import { buildChunks } from './chunk.mjs';
import { embedTexts, mockEmbedding } from './embed.mjs';
import { parseCorpus, serializeCorpus, FORMAT, FORMAT_VERSION } from './jsonl.mjs';
import { LatticeClient } from './lattice.mjs';
import { provisionServer } from './server.mjs';

const UPSERT_BATCH = 256;
const SELF_RETRIEVAL_SAMPLES = 5;
const SELF_RETRIEVAL_MAX_DISTANCE = 1e-3; // score is a cosine DISTANCE: 0 = identical
const SCROLL_TOLERANCE = 1e-6;
const SCROLL_SAMPLE_LIMIT = 256;

function readInputs() {
  const apiKey = getInput('embedding-api-key');
  addMask(apiKey); // before any other output

  const mock = getBoolInput('mock-embeddings');
  const inputs = {
    paths: getRequiredInput('paths').split('\n').map((s) => s.trim()).filter(Boolean),
    exclude: getInput('exclude').split('\n').map((s) => s.trim()).filter(Boolean),
    // Fallbacks mirror action.yml defaults (these inputs are required: false
    // there); getRequiredInput would wrongly reject a bare-env invocation.
    collection: getInput('collection') || 'coderag',
    outputDir: getInput('output-dir') || 'autoreporag-out',
    outputName: getInput('output-name') || 'coderag',
    gzip: getBoolInput('gzip'),
    endpoint: getInput('embedding-endpoint'),
    model: getInput('embedding-model'),
    apiKey,
    mock,
    mockDim: getIntInput('mock-dim', { min: 1 }),
    chunkLines: getIntInput('chunk-lines', { min: 2 }),
    chunkOverlap: getIntInput('chunk-overlap', { min: 0 }),
    maxChunkBytes: getIntInput('max-chunk-bytes', { min: 64 }),
    batchSize: getIntInput('batch-size', { min: 1 }),
    requestIntervalMs: getIntInput('request-interval-ms', { min: 0 }),
    maxRetries: getIntInput('max-retries', { min: 1 }),
    maxChunks: getIntInput('max-chunks', { min: 0 }),
    vectorPrecision: getIntInput('vector-precision', { min: 1 }),
    previousCorpusUrl: getInput('previous-corpus-url'),
    latticeVersion: getInput('lattice-version') || 'v0.3.3',
    latticePort: getIntInput('lattice-port', { min: 1, max: 65535 }),
  };
  if (inputs.chunkOverlap >= inputs.chunkLines) {
    throw new Error(`chunk-overlap (${inputs.chunkOverlap}) must be < chunk-lines (${inputs.chunkLines})`);
  }
  if (!inputs.mock) {
    if (!inputs.endpoint) throw new Error('embedding-endpoint is required when mock-embeddings is false');
    if (!inputs.model) throw new Error('embedding-model is required when mock-embeddings is false');
    if (!inputs.apiKey) throw new Error('embedding-api-key is required when mock-embeddings is false');
  }
  return inputs;
}

function gitContext(root) {
  const run = (args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  const commitSha = process.env.GITHUB_SHA || run(['rev-parse', 'HEAD']);
  let repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    const remote = run(['config', '--get', 'remote.origin.url']);
    const m = /[:/]([^/:]+\/[^/]+?)(?:\.git)?$/.exec(remote);
    if (!m) throw new Error(`cannot derive "owner/repo" from remote ${remote}; set GITHUB_REPOSITORY`);
    repo = m[1];
  }
  return { commitSha, repo };
}

async function fetchBytes(url) {
  if (url.startsWith('file://')) return readFileSync(fileURLToPath(url));
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`previous-corpus-url must be file:// or http(s)://, got ${url}`);
}

/**
 * Load a previous corpus for incremental reuse. The sibling meta.json
 * (<url stripped of .gz/.jsonl> + .meta.json) declares which model produced
 * it; without a verifiable model match the cache is discarded (a corpus of
 * foreign vectors mixed into fresh ones would verify and still be garbage).
 */
async function loadPreviousCorpus(url, expectedModel, expectedDim) {
  let dump;
  let metaModel = null;
  try {
    let bytes = await fetchBytes(url);
    if (isGzipBytes(bytes)) bytes = gunzip(bytes);
    dump = parseCorpus(bytes.toString('utf8'));
  } catch (e) {
    warning(`previous-corpus-url unusable, doing a full embed: ${e.message}`);
    return null;
  }
  const metaUrl = `${url.replace(/\.gz$/, '').replace(/\.jsonl$/, '')}.meta.json`;
  try {
    metaModel = JSON.parse((await fetchBytes(metaUrl)).toString('utf8')).model ?? null;
  } catch (e) {
    warning(`previous corpus meta ${metaUrl} unreadable (${e.message})`);
  }
  if (metaModel !== expectedModel) {
    warning(
      `previous corpus discarded: model ${JSON.stringify(metaModel)} != current ${JSON.stringify(expectedModel)}`,
    );
    return null;
  }
  if (expectedDim !== null && dump.header.dim !== expectedDim) {
    warning(`previous corpus discarded: dim ${dump.header.dim} != current ${expectedDim}`);
    return null;
  }
  const byHash = new Map();
  for (const p of dump.points) {
    const hash = p.payload?.chunk_hash;
    if (typeof hash === 'string' && p.vector.length === dump.header.dim) {
      byHash.set(hash, p.vector);
    }
  }
  log(`[reuse] previous corpus loaded: ${byHash.size} reusable vectors (dim ${dump.header.dim})`);
  return { dim: dump.header.dim, byHash };
}

/** Resolve vectors for every chunk: reuse by chunk_hash, embed the rest. */
async function resolveVectors(chunks, inputs, prev) {
  const rawByHash = new Map();
  let dim;
  let reused = 0;

  if (prev) {
    for (const c of chunks) {
      if (prev.byHash.has(c.chunkHash) && !rawByHash.has(c.chunkHash)) {
        rawByHash.set(c.chunkHash, prev.byHash.get(c.chunkHash));
        reused += 1;
      }
    }
  }
  const missing = chunks.filter((c) => !rawByHash.has(c.chunkHash));

  if (inputs.mock) {
    dim = inputs.mockDim;
    for (const c of missing) rawByHash.set(c.chunkHash, mockEmbedding(c.chunkHash, dim));
  } else if (missing.length === 0) {
    dim = prev.dim; // everything reused; prev model already matched
  } else {
    log(`[embed] embedding ${missing.length}/${chunks.length} chunks via ${inputs.endpoint} (${inputs.model})`);
    const opts = {
      endpoint: inputs.endpoint, model: inputs.model, apiKey: inputs.apiKey,
      batchSize: inputs.batchSize, requestIntervalMs: inputs.requestIntervalMs,
      maxRetries: inputs.maxRetries,
    };
    const first = await embedTexts(missing.map((c) => c.payload.text), opts);
    dim = first.dim;
    missing.forEach((c, i) => rawByHash.set(c.chunkHash, first.vectors[i]));
    if (prev && reused > 0 && dim !== prev.dim) {
      warning(`previous corpus discarded mid-run: live dim ${dim} != cached dim ${prev.dim}; re-embedding reused chunks`);
      const stale = chunks.filter((c) => prev.byHash.has(c.chunkHash) && rawByHash.get(c.chunkHash) === prev.byHash.get(c.chunkHash));
      if (stale.length > 0) {
        const redo = await embedTexts(stale.map((c) => c.payload.text), opts);
        if (redo.dim !== dim) throw new Error(`embedding dim drifted within one run: ${redo.dim} != ${dim}`);
        stale.forEach((c, i) => rawByHash.set(c.chunkHash, redo.vectors[i]));
      }
      reused = 0;
    }
  }

  const points = chunks.map((c) => ({
    id: c.id,
    vector: quantizeVector(rawByHash.get(c.chunkHash), inputs.vectorPrecision),
    payload: c.payload,
  }));
  return { points, dim, embedded: chunks.length - reused, reused };
}

async function loadAndVerify(client, collection, dim, points) {
  await client.createCollection(collection, dim);
  for (let i = 0; i < points.length; i += UPSERT_BATCH) {
    await client.upsertBatch(collection, points.slice(i, i + UPSERT_BATCH));
  }
  const info = await client.collectionInfo(collection);
  if (info.points_count !== points.length) {
    throw new Error(`verification failed: server points_count ${info.points_count} != ${points.length} upserted`);
  }

  // Self-retrieval: searching a point's own vector must return that point at
  // rank 1 with (near-)zero cosine distance.
  const n = points.length;
  const sampleIdx = new Set();
  for (let k = 0; k < Math.min(SELF_RETRIEVAL_SAMPLES, n); k++) {
    sampleIdx.add(Math.floor((k * (n - 1)) / Math.max(1, SELF_RETRIEVAL_SAMPLES - 1)));
  }
  for (const idx of sampleIdx) {
    const p = points[idx];
    const hits = await client.search(collection, p.vector, 1);
    if (!Array.isArray(hits) || hits.length === 0) {
      throw new Error(`verification failed: self-retrieval for id ${p.id} returned no hits`);
    }
    const top = hits[0];
    if (top.id !== p.id || !(top.score <= SELF_RETRIEVAL_MAX_DISTANCE)) {
      throw new Error(
        `verification failed: self-retrieval for id ${p.id} got id ${top.id} at distance ${top.score} ` +
          `(need own id at distance <= ${SELF_RETRIEVAL_MAX_DISTANCE})`,
      );
    }
  }

  // Scroll fidelity: vectors the server hands back must equal what we hold
  // locally (both went through fround, so agreement should be exact; 1e-6
  // tolerance allows for transport formatting).
  const byId = new Map(points.map((p) => [p.id, p.vector]));
  const page = await client.scroll(collection, { limit: Math.min(SCROLL_SAMPLE_LIMIT, n) });
  if (!Array.isArray(page?.points) || page.points.length === 0) {
    throw new Error('verification failed: scroll returned no points');
  }
  for (const sp of page.points) {
    const local = byId.get(sp.id);
    if (!local) throw new Error(`verification failed: scroll returned unknown id ${sp.id}`);
    if (!Array.isArray(sp.vector) || sp.vector.length !== local.length) {
      throw new Error(`verification failed: scroll id ${sp.id} vector length ${sp.vector?.length} != ${local.length}`);
    }
    for (let i = 0; i < local.length; i++) {
      if (!(Math.abs(sp.vector[i] - local[i]) <= SCROLL_TOLERANCE)) {
        throw new Error(
          `verification failed: scroll id ${sp.id} component ${i} is ${sp.vector[i]}, local ${local[i]} (tolerance ${SCROLL_TOLERANCE})`,
        );
      }
    }
  }
  log(`[verify] points_count ${info.points_count}, ${sampleIdx.size} self-retrievals, ${page.points.length} scrolled vectors OK`);
}

/**
 * Emit a step output in the `name<<DELIM` heredoc form. The plain name=value
 * form is injectable: a user-controlled value (output-dir, output-name feed
 * into paths) containing a newline would define extra outputs.
 */
function setOutput(name, value) {
  if (/[\r\n]/.test(name)) throw new Error(`output name ${JSON.stringify(name)} contains a newline`);
  const delim = `ghadelim_${randomBytes(16).toString('hex')}`;
  const text = String(value);
  if (text.includes(delim)) throw new Error(`output value for ${name} collides with delimiter ${delim}`);
  appendGithubFile('GITHUB_OUTPUT', `${name}<<${delim}\n${text}\n${delim}\n`);
}

async function run() {
  const inputs = readInputs();
  const root = process.env.GITHUB_WORKSPACE || process.cwd();
  const { commitSha, repo } = gitContext(root);
  const outputDir = isAbsolute(inputs.outputDir) ? inputs.outputDir : resolve(root, inputs.outputDir);
  mkdirSync(outputDir, { recursive: true });
  const tempBase = process.env.RUNNER_TEMP || resolve(root, '.work');
  mkdirSync(tempBase, { recursive: true });
  const pidFile = join(tempBase, 'autoreporag-lattice.pid');

  const server = await provisionServer({
    version: inputs.latticeVersion,
    port: inputs.latticePort,
    workDir: join(tempBase, 'autoreporag'),
    pidFile,
  });

  try {
    const { chunks, fileCount, matchedFiles, skippedBinary, truncated } = buildChunks({
      root,
      includeGlobs: inputs.paths,
      excludeGlobs: inputs.exclude,
      chunkLines: inputs.chunkLines,
      chunkOverlap: inputs.chunkOverlap,
      maxChunkBytes: inputs.maxChunkBytes,
      maxChunks: inputs.maxChunks,
      repo,
      commitSha,
    });
    if (chunks.length === 0) {
      throw new Error(`no chunks produced: ${matchedFiles} file(s) matched paths, ${skippedBinary.length} skipped as binary`);
    }
    if (skippedBinary.length > 0) log(`[chunk] skipped ${skippedBinary.length} binary file(s)`);
    if (truncated) warning(`max-chunks=${inputs.maxChunks} truncated the chunk list`);
    log(`[chunk] ${chunks.length} chunks from ${fileCount} file(s) at ${commitSha}`);

    const expectedModel = inputs.mock ? 'mock' : inputs.model;
    const prev = inputs.previousCorpusUrl
      ? await loadPreviousCorpus(inputs.previousCorpusUrl, expectedModel, inputs.mock ? inputs.mockDim : null)
      : null;

    const { points, dim, embedded, reused } = await resolveVectors(chunks, inputs, prev);
    log(`[embed] dim ${dim}: ${embedded} embedded, ${reused} reused`);

    const client = new LatticeClient(server.baseUrl);
    await loadAndVerify(client, inputs.collection, dim, points);

    const corpusText = serializeCorpus({ collectionName: inputs.collection, dim, points });
    const corpusFile = join(outputDir, `${inputs.outputName}.jsonl`);
    writeFileSync(corpusFile, corpusText);
    const bytes = Buffer.byteLength(corpusText);
    const sha256 = sha256Hex(corpusText);

    let gzFile = '';
    let gzBytes = 0;
    if (inputs.gzip) {
      const gz = gzip9(Buffer.from(corpusText));
      gzFile = join(outputDir, `${inputs.outputName}.jsonl.gz`);
      writeFileSync(gzFile, gz);
      gzBytes = gz.length;
    }

    const meta = {
      format: FORMAT,
      version: FORMAT_VERSION,
      dim,
      points: points.length,
      files: fileCount,
      embedded,
      reused,
      model: expectedModel,
      endpoint: inputs.mock ? 'mock' : inputs.endpoint,
      repo,
      commit_sha: commitSha,
      generated_at: new Date().toISOString(),
      bytes,
      gz_bytes: gzBytes,
      sha256,
      action_version: process.env.GITHUB_ACTION_REF || 'local',
      lattice_version: inputs.latticeVersion,
    };
    const metaFile = join(outputDir, `${inputs.outputName}.meta.json`);
    writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`);

    setOutput('corpus-file', corpusFile);
    setOutput('corpus-gz-file', gzFile);
    setOutput('metadata-file', metaFile);
    setOutput('dim', String(dim));
    setOutput('points', String(points.length));
    setOutput('embedded', String(embedded));
    setOutput('reused', String(reused));
    setOutput('sha256', sha256);

    appendGithubFile(
      'GITHUB_STEP_SUMMARY',
      [
        '### AutoRepoRAG corpus',
        '',
        '| metric | value |',
        '|---|---|',
        `| points | ${points.length} |`,
        `| files | ${fileCount} |`,
        `| dim | ${dim} |`,
        `| embedded / reused | ${embedded} / ${reused} |`,
        `| model | \`${expectedModel}\` |`,
        `| commit | \`${commitSha}\` |`,
        `| corpus | \`${corpusFile}\` (${bytes} B${gzBytes ? `, ${gzBytes} B gz` : ''}) |`,
        `| sha256 | \`${sha256}\` |`,
        '',
      ].join('\n'),
    );
    log(`[done] ${corpusFile} (${bytes} B, sha256 ${sha256})`);
  } finally {
    await server.stop();
  }
}

run().catch((e) => {
  process.stdout.write(`::error::AutoRepoRAG failed: ${e.message}\n`);
  console.error(e.stack || String(e));
  process.exit(1);
});
