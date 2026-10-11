// inputs.mjs — parse and validate the action's inputs.
//
// Contract: pure. Takes the INPUT_* environment map (process.env in
// production, a literal in tests) and returns a validated inputs object, or
// throws naming the offending input. action.yml is the single source of
// truth for every default: inputs that shape the corpus have none and are
// required here; plumbing inputs get their default from action.yml and are
// still read as required, so a bare-env invocation must state them too.

import { getBoolInput, getInput, getIntInput, getRequiredInput } from './util.mjs';

export const WEBSITE_CHAT_UNAVAILABLE = 'website chat library not available in this version';

function lines(raw) {
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}

/** `dependentName` is required iff `condition` holds; set otherwise it would be silently ignored. */
function requiredIff(dependentName, dependentValue, condition, conditionText) {
  if (condition && !dependentValue) {
    throw new Error(`input "${dependentName}" is required when ${conditionText}`);
  }
  if (!condition && dependentValue) {
    throw new Error(`input "${dependentName}" is only valid when ${conditionText}; refusing to ignore it`);
  }
}

export function readInputs(env) {
  const mock = getBoolInput(env, 'mock-embeddings');
  const inputs = {
    paths: lines(getRequiredInput(env, 'paths')),
    exclude: lines(getInput(env, 'exclude')),
    sourceDir: getInput(env, 'source-dir'),
    collection: getRequiredInput(env, 'collection'),
    outputDir: getRequiredInput(env, 'output-dir'),
    outputName: getRequiredInput(env, 'output-name'),
    gzip: getBoolInput(env, 'gzip'),
    endpoint: getInput(env, 'embedding-endpoint'),
    model: getInput(env, 'embedding-model'),
    apiKey: getInput(env, 'embedding-api-key'),
    mock,
    mockDim: getIntInput(env, 'mock-dim', { min: 1 }),
    chunkLines: getIntInput(env, 'chunk-lines', { min: 2 }),
    chunkOverlap: getIntInput(env, 'chunk-overlap', { min: 0 }),
    maxChunkBytes: getIntInput(env, 'max-chunk-bytes', { min: 64 }),
    batchSize: getIntInput(env, 'batch-size', { min: 1 }),
    requestIntervalMs: getIntInput(env, 'request-interval-ms', { min: 0 }),
    maxRetries: getIntInput(env, 'max-retries', { min: 1 }),
    maxChunks: getIntInput(env, 'max-chunks', { min: 0 }),
    vectorPrecision: getIntInput(env, 'vector-precision', { min: 1 }),
    previousCorpusUrl: getInput(env, 'previous-corpus-url'),
    previousCorpusMetaUrl: getInput(env, 'previous-corpus-meta-url'),
    latticeVersion: getRequiredInput(env, 'lattice-version'),
    latticePort: getIntInput(env, 'lattice-port', { min: 1, max: 65535 }),
    generateWebsiteChat: getBoolInput(env, 'generate-website-chat'),
    websiteChatDir: getInput(env, 'website-chat-dir'),
  };
  if (inputs.chunkOverlap >= inputs.chunkLines) {
    throw new Error(`chunk-overlap (${inputs.chunkOverlap}) must be < chunk-lines (${inputs.chunkLines})`);
  }
  if (!inputs.mock) {
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
    throw new Error(`generate-website-chat is "true": ${WEBSITE_CHAT_UNAVAILABLE}`);
  }
  return inputs;
}
