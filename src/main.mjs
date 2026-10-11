// main.mjs — AutoRepoRAG orchestrator.
//
// Contract: reads composite-action inputs from INPUT_* env vars, provisions a
// pinned local lattice-server, chunks the repository (or the external
// checkout named by source-dir), reuses vectors from a
// previous corpus (chunk_hash match, guarded by dim + model), embeds the rest
// (mock or live), quantizes every vector (significant digits + fround) BEFORE
// both upsert and export, loads + verifies the collection (points_count,
// 5-sample self-retrieval with cosine-distance <= 1e-3, scroll fidelity at
// 1e-6), writes the lattice-jsonl corpus + gzip -9 twin + meta.json, emits
// the website-chat bundle into <output-dir>/<website-chat-dir> when asked,
// and emits GITHUB_OUTPUT / GITHUB_STEP_SUMMARY. Exits nonzero on any failure.

import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  addMask, appendGithubFile, getInput, gunzip, gzip9, isGzipBytes, log, quantizeVector, sha256Hex, warning,
} from './util.mjs';
import { buildChunks } from './chunk.mjs';
import { embedTexts, mockEmbedding } from './embed.mjs';
import { gitContext } from './git.mjs';
import { readInputs } from './inputs.mjs';
import { parseCorpus, serializeCorpus, FORMAT, FORMAT_VERSION } from './jsonl.mjs';
import { LatticeClient } from './lattice.mjs';
import { provisionServer } from './server.mjs';
import { emitWebsiteChat, LIBRARY_DIR } from './website-chat.mjs';

const UPSERT_BATCH = 256;
const SELF_RETRIEVAL_SAMPLES = 5;
const SELF_RETRIEVAL_MAX_DISTANCE = 1e-3; // score is a cosine DISTANCE: 0 = identical
const SCROLL_TOLERANCE = 1e-6;
const SCROLL_SAMPLE_LIMIT = 256;

async function fetchBytes(url) {
  if (url.startsWith('file://')) return readFileSync(fileURLToPath(url));
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`previous corpus URLs must be file:// or http(s)://, got ${url}`);
}

/**
 * Load a previous corpus for incremental reuse. Its meta.json (the explicit
 * previous-corpus-meta-url) declares which model produced it; without a
 * verifiable model match the cache is discarded (a corpus of foreign vectors
 * mixed into fresh ones would verify and still be garbage).
 */
async function loadPreviousCorpus(url, metaUrl, expectedModel, expectedDim) {
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
    // Seed by TEXT (not chunk_hash, which mixes in the path) so byte-identical
    // chunks in different files embed identically — matching live-embedder
    // behavior, which is what makes the tie-tolerant verify testable in CI.
    for (const c of missing) rawByHash.set(c.chunkHash, mockEmbedding(c.payload.text, dim));
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
  // (near-)zero cosine distance. Byte-identical chunk text in different files
  // (duplicated headers, copied kernels) produces identical embeddings, so the
  // sampled point may legitimately tie at distance 0 behind a twin — accept
  // any hit that is the point itself, or a tie whose payload text matches.
  const n = points.length;
  const sampleIdx = new Set();
  for (let k = 0; k < Math.min(SELF_RETRIEVAL_SAMPLES, n); k++) {
    sampleIdx.add(Math.floor((k * (n - 1)) / Math.max(1, SELF_RETRIEVAL_SAMPLES - 1)));
  }
  for (const idx of sampleIdx) {
    const p = points[idx];
    const hits = await client.search(collection, p.vector, 5);
    if (!Array.isArray(hits) || hits.length === 0) {
      throw new Error(`verification failed: self-retrieval for id ${p.id} returned no hits`);
    }
    const near = hits.filter((h) => h.score <= SELF_RETRIEVAL_MAX_DISTANCE);
    const self = near.find((h) => h.id === p.id);
    const twin = near.find((h) => h.payload && h.payload.text === p.payload.text);
    if (!self && !twin) {
      const top = hits[0];
      throw new Error(
        `verification failed: self-retrieval for id ${p.id} got id ${top.id} at distance ${top.score} ` +
          `(need the point itself or an identical-text twin at distance <= ${SELF_RETRIEVAL_MAX_DISTANCE})`,
      );
    }
    if (!self && twin) {
      log(`[verify] id ${p.id} tied with identical-text twin id ${twin.id} at distance ${twin.score} — accepted`);
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
  addMask(getInput(process.env, 'embedding-api-key')); // before any other output
  const inputs = readInputs(process.env);
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const { root, commitSha, repo } = gitContext(workspace, inputs.sourceDir, process.env);
  if (inputs.sourceDir) log(`[source] ${inputs.sourceDir}: ${repo} @ ${commitSha}`);
  const outputDir = isAbsolute(inputs.outputDir) ? inputs.outputDir : resolve(workspace, inputs.outputDir);
  mkdirSync(outputDir, { recursive: true });
  const tempBase = process.env.RUNNER_TEMP || resolve(workspace, '.work');
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
      ? await loadPreviousCorpus(
        inputs.previousCorpusUrl, inputs.previousCorpusMetaUrl, expectedModel, inputs.mock ? inputs.mockDim : null,
      )
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

    let chatDir = '';
    if (inputs.generateWebsiteChat) {
      ({ dir: chatDir } = await emitWebsiteChat({
        outDir: join(outputDir, inputs.websiteChatDir),
        latticeVersion: inputs.latticeVersion,
        cacheDir: join(tempBase, 'autoreporag', 'lattice-wasm'),
        libraryDir: LIBRARY_DIR,
      }));
    }

    setOutput('corpus-file', corpusFile);
    setOutput('corpus-gz-file', gzFile);
    setOutput('metadata-file', metaFile);
    setOutput('dim', String(dim));
    setOutput('points', String(points.length));
    setOutput('embedded', String(embedded));
    setOutput('reused', String(reused));
    setOutput('sha256', sha256);
    setOutput('website-chat-dir', chatDir);

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
        ...(chatDir ? [`| website chat | \`${chatDir}\` |`] : []),
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
