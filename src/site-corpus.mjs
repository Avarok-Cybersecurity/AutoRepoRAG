// site-corpus.mjs — the v3 corpus: chunk (lines or markdown), merge the
// payload sidecar, resolve edges, embed only when the search mode has
// vectors, load + verify, serialize, and export the snapshot.
//
// Contract: JSON input files arrive through the injected `readJson` (the
// caller owns the I/O and the error naming the input); nothing here writes
// to disk. Lexical corpora make no embedding call at all.

import { headerConfig } from './collection-v3.mjs';
import { chunkSource, embedChunks } from './corpus.mjs';
import { resolveEdges } from './edges.mjs';
import { serializeCorpus } from './jsonl.mjs';
import { mergeSidecar } from './sidecar.mjs';
import { exportVerifiedSnapshot, snapshotProbe } from './snapshot.mjs';
import { log } from './util.mjs';
import { loadAndVerifyV3 } from './verify-v3.mjs';

/**
 * @param {{inputs: ReturnType<typeof import('./inputs.mjs').readInputs>,
 *   client: import('./lattice.mjs').LatticeClient, source: import('./corpus.mjs').Source,
 *   readJson: (path: string, inputName: string) => unknown}} opts
 * @returns {Promise<import('./corpus.mjs').BuiltCorpus>}
 */
export async function buildSiteCorpus({ inputs, client, source, readJson }) {
  const { v3 } = inputs;
  const listing = v3.filesDir ? 'walk' : 'git';
  const chunked = chunkSource(inputs, source, { listing, strategy: v3.chunkStrategy });
  const chunks = v3.payloadSidecar
    ? mergeSidecar(chunked.chunks, readJson(v3.payloadSidecar, 'payload-sidecar'))
    : chunked.chunks;
  const { edges, relations } = resolveEdges(
    chunks, v3.edgesFile ? readJson(v3.edgesFile, 'edges-file') : [], { nextEdges: v3.chunkStrategy === 'markdown' },
  );
  log(`[edges] ${edges.length} edge(s), relations ${JSON.stringify(Object.keys(relations))}`);

  const lexical = v3.searchMode === 'lexical';
  const embedded = lexical
    ? { points: chunks.map((c) => ({ id: c.id, vector: [], payload: c.payload })), dim: 0, embedded: 0, reused: 0, model: null }
    : await embedChunks(chunks, inputs);

  const shape = {
    name: inputs.collection,
    searchMode: v3.searchMode,
    dim: embedded.dim,
    vectorIndex: v3.vectorIndex,
    vectorStorage: v3.vectorStorage,
    model: embedded.model,
    relations,
  };
  const stored = await loadAndVerifyV3(client, { collection: inputs.collection, shape, points: embedded.points, edges });
  const config = headerConfig(shape);
  const snapshotBytes = v3.snapshot
    ? await exportVerifiedSnapshot(client, {
      collection: inputs.collection, config, maxBytes: v3.maxSnapshotBytes, probe: snapshotProbe(v3.searchMode, stored[0]),
    })
    : null;
  return {
    corpusText: serializeCorpus({ collectionName: inputs.collection, dim: embedded.dim, points: stored, config, edges }),
    snapshotBytes,
    dim: embedded.dim,
    points: stored.length,
    fileCount: chunked.fileCount,
    embedded: embedded.embedded,
    reused: embedded.reused,
    model: embedded.model,
    edges: edges.length,
    shape,
  };
}
