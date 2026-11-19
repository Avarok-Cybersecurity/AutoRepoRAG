// corpus.mjs — build a corpus in a running lattice-server: shared steps and
// the v2 (repository, vectors only) path. The v3 path is src/site-corpus.mjs.
//
// Contract: both builders return a BuiltCorpus; the caller (src/run.mjs)
// writes the files and the metadata. Nothing here writes to disk; reads and
// network calls go through the injected io port (src/ports.mjs Io), and the
// lattice-server through the injected LatticeStore port.

import { buildChunks, chunkerFor } from './chunk.mjs';
import { serializeCorpus } from './jsonl.mjs';
import { log, warning } from './log.mjs';
import { loadPreviousCorpus, resolveVectors } from './vectors.mjs';
import { loadAndVerify } from './verify.mjs';

/**
 * @typedef {{corpusText: string, snapshotBytes: Buffer|null, dim: number, points: number,
 *   fileCount: number, embedded: number, reused: number, model: string|null, edges: number,
 *   shape: import('./collection-v3.mjs').CollectionShape|null}} BuiltCorpus
 * @typedef {{root: string, repo: string, commitSha: string}} Source
 */

/** Chunk the source; fails when nothing was produced. */
export function chunkSource(inputs, source, { listing, strategy }, io) {
  const { chunks, fileCount, matchedFiles, skippedBinary, truncated } = buildChunks({
    root: source.root,
    includeGlobs: inputs.paths,
    excludeGlobs: inputs.exclude,
    listing,
    chunkFile: chunkerFor(strategy, inputs),
    maxChunks: inputs.maxChunks,
    repo: source.repo,
    commitSha: source.commitSha,
  }, io);
  if (chunks.length === 0) {
    throw new Error(`no chunks produced: ${matchedFiles} file(s) matched paths, ${skippedBinary.length} skipped as binary`);
  }
  if (skippedBinary.length > 0) log(`[chunk] skipped ${skippedBinary.length} binary file(s)`);
  if (truncated) warning(`max-chunks=${inputs.maxChunks} truncated the chunk list`);
  log(`[chunk] ${chunks.length} chunks from ${fileCount} file(s) at ${source.commitSha} (${strategy})`);
  return { chunks, fileCount };
}

/** Vectors for every chunk (reuse, then embed); `model` is what meta.json records. */
export async function embedChunks(chunks, inputs, io) {
  const model = inputs.mock ? 'mock' : inputs.model;
  const prev = inputs.previousCorpusUrl
    ? await loadPreviousCorpus(inputs.previousCorpusUrl, inputs.previousCorpusMetaUrl, model, inputs.mock ? inputs.mockDim : null, io)
    : null;
  const { points, dim, embedded, reused } = await resolveVectors(chunks, inputs, prev, io);
  log(`[embed] dim ${dim}: ${embedded} embedded, ${reused} reused`);
  return { points, dim, embedded, reused, model };
}

/**
 * v2: a repository (or source-dir checkout), line windows, vectors only.
 * @param {{inputs: ReturnType<typeof import('./inputs.mjs').readInputs>, client: import('./ports.mjs').LatticeStore,
 *   source: Source, io: import('./ports.mjs').Io}} deps
 * @returns {Promise<BuiltCorpus>}
 */
export async function buildRepoCorpus({ inputs, client, source, io }) {
  const { chunks, fileCount } = chunkSource(inputs, source, { listing: 'git', strategy: 'lines' }, io);
  const { points, dim, embedded, reused, model } = await embedChunks(chunks, inputs, io);
  await loadAndVerify(client, inputs.collection, dim, points);
  return {
    corpusText: serializeCorpus({ collectionName: inputs.collection, dim, points }),
    snapshotBytes: null,
    dim,
    points: points.length,
    fileCount,
    embedded,
    reused,
    model,
    edges: 0,
    shape: null,
  };
}
