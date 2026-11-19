// main.mjs — AutoRepoRAG entrypoint (the composite action runs this).
//
// Contract: runs the pipeline (src/run.mjs) on process.env with the pinned,
// sha256-verified lattice-server release (src/server.mjs provisionServer).
// Exits nonzero on any failure, after an ::error:: line naming it.

import { runAction } from './run.mjs';
import { provisionServer } from './server.mjs';

runAction({ env: process.env, provision: provisionServer }).catch((e) => {
  process.stdout.write(`::error::AutoRepoRAG failed: ${e.message}\n`);
  console.error(e.stack || String(e));
  process.exit(1);
});
