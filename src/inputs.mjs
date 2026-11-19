// inputs.mjs — parse and validate the action's inputs.
//
// Contract: pure. Takes the INPUT_* environment map (process.env in
// production, a literal in tests) and returns a validated inputs object, or
// throws naming the offending input. action.yml is the single source of
// truth for every default: inputs that shape the corpus have none and are
// required here; plumbing inputs get their default from action.yml and are
// still read as required, so a bare-env invocation must state them too.
// v3 inputs (src/inputs-v3.mjs) decide which of the conditional inputs
// (embedding/vector ones, chunk-lines/overlap) apply; v2 needs them all.

import { atLeast, MIN_V3_LATTICE } from './lattice-version.mjs';
import { readV3Inputs, refuse, requiredIff } from './inputs-v3.mjs';
import { relativeInside } from './paths.mjs';
import { getBoolInput, getInput, getIntInput, getRequiredInput } from './action-inputs.mjs';

function lines(raw) {
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}

/** Read an int input the mode needs, or refuse it when the mode ignores it (null). */
function conditionalInt(env, name, applies, conditionText, bounds) {
  if (applies) return getIntInput(env, name, bounds);
  refuse(env, name, conditionText);
  return null;
}

export function readInputs(env) {
  const v3 = readV3Inputs(env);
  const vectors = !v3 || v3.searchMode !== 'lexical';
  const byLines = !v3 || v3.chunkStrategy === 'lines';
  const linesOnly = 'chunk-strategy is "lines"';
  const mock = getBoolInput(env, 'mock-embeddings');
  const inputs = {
    paths: lines(getRequiredInput(env, 'paths')),
    exclude: lines(getInput(env, 'exclude')),
    sourceDir: getInput(env, 'source-dir'),
    collection: getRequiredInput(env, 'collection'),
    outputDir: getRequiredInput(env, 'output-dir'),
    outputName: getRequiredInput(env, 'output-name'),
    gzip: getBoolInput(env, 'gzip'),
    endpoint: vectors ? getRequiredInput(env, 'embedding-endpoint') : '',
    model: getInput(env, 'embedding-model'),
    apiKey: getInput(env, 'embedding-api-key'),
    mock,
    mockDim: getIntInput(env, 'mock-dim', { min: 1 }),
    chunkLines: conditionalInt(env, 'chunk-lines', byLines, linesOnly, { min: 2 }),
    chunkOverlap: conditionalInt(env, 'chunk-overlap', byLines, linesOnly, { min: 0 }),
    maxChunkBytes: getIntInput(env, 'max-chunk-bytes', { min: 64 }),
    batchSize: getIntInput(env, 'batch-size', { min: 1 }),
    requestIntervalMs: vectors ? getIntInput(env, 'request-interval-ms', { min: 0 }) : null,
    maxRetries: getIntInput(env, 'max-retries', { min: 1 }),
    maxChunks: getIntInput(env, 'max-chunks', { min: 0 }),
    vectorPrecision: vectors ? getIntInput(env, 'vector-precision', { min: 1 }) : null,
    previousCorpusUrl: getInput(env, 'previous-corpus-url'),
    previousCorpusMetaUrl: getInput(env, 'previous-corpus-meta-url'),
    latticeVersion: getRequiredInput(env, 'lattice-version'),
    latticePort: getIntInput(env, 'lattice-port', { min: 1, max: 65535 }),
    generateWebsiteChat: getBoolInput(env, 'generate-website-chat'),
    websiteChatDir: getInput(env, 'website-chat-dir'),
    v3,
  };
  if (v3 && !atLeast(inputs.latticeVersion, MIN_V3_LATTICE)) {
    throw new Error(`v3 mode needs lattice-version >= ${MIN_V3_LATTICE} (a pinned tag), got ${JSON.stringify(inputs.latticeVersion)}`);
  }
  if (byLines && inputs.chunkOverlap >= inputs.chunkLines) {
    throw new Error(`chunk-overlap (${inputs.chunkOverlap}) must be < chunk-lines (${inputs.chunkLines})`);
  }
  if (vectors && !inputs.mock) {
    if (!inputs.model) throw new Error('embedding-model is required when mock-embeddings is false');
    if (!inputs.apiKey) throw new Error('embedding-api-key is required when mock-embeddings is false');
  }
  requiredIff(
    'previous-corpus-meta-url', inputs.previousCorpusMetaUrl,
    Boolean(inputs.previousCorpusUrl), 'previous-corpus-url is set',
  );
  requiredIff(
    'website-chat-dir', inputs.websiteChatDir,
    inputs.generateWebsiteChat, 'generate-website-chat is "true"',
  );
  if (inputs.generateWebsiteChat) {
    const rel = relativeInside(inputs.websiteChatDir, 'website-chat-dir', 'output-dir');
    if (rel === '.') {
      throw new Error('website-chat-dir must name a subdirectory of the output-dir, not the output-dir itself');
    }
    inputs.websiteChatDir = rel;
  }
  return inputs;
}
