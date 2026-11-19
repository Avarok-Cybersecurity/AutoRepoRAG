// main.mjs — AutoRepoRAG entrypoint and composition root (the composite
// action runs this).
//
// Contract: masks the embedding key, parses the run configuration from
// process.env once (src/run-config.mjs: a missing input or GITHUB_WORKSPACE /
// RUNNER_TEMP is an error, never a fallback), and runs the pipeline
// (src/run.mjs) with the node io adapter (src/adapters/node-io.mjs) and the
// pinned, sha256-verified lattice-server release (src/adapters/server.mjs).
// Exits nonzero on any failure, after an ::error:: line naming it.

import { addMask } from './adapters/github.mjs';
import { nodeIo } from './adapters/node-io.mjs';
import { provisionServer } from './adapters/server.mjs';
import { readRunConfig } from './run-config.mjs';
import { runAction } from './run.mjs';
import { getInput } from './action-inputs.mjs';

async function main(env) {
  addMask(env, getInput(env, 'embedding-api-key')); // before any other output
  await runAction({ config: readRunConfig(env), io: nodeIo(env), provision: provisionServer });
}

main(process.env).catch((e) => {
  process.stdout.write(`::error::AutoRepoRAG failed: ${e.message}\n`);
  console.error(e.stack || String(e));
  process.exit(1);
});
