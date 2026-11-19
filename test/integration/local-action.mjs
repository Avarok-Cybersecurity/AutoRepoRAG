// local-action.mjs — run the whole action (src/run.mjs) against a locally
// built lattice-server instead of a downloaded release.
//
// Test harness only: production (src/main.mjs) never reads LATTICE_SERVER_PATH.
// Use it where no release binary fits: before a lattice-db release exists
// (v3 needs >= v0.5.0), or on macOS (releases ship linux binaries). Build one:
//   CARGO_TARGET_DIR=$PWD/.lattice-target cargo build --release \
//     -p latticedb-server --bin lattice-server --manifest-path <lattice-db>/Cargo.toml
//   LATTICE_SERVER_PATH=$PWD/.lattice-target/release/lattice-server \
//     INPUT_...=... node test/integration/local-action.mjs

import { existsSync } from 'node:fs';

import { runAction } from '../../src/run.mjs';
import { startServer } from '../../src/server.mjs';

const binary = process.env.LATTICE_SERVER_PATH;
if (!binary || !existsSync(binary)) {
  process.stdout.write(`::error::LATTICE_SERVER_PATH must name a built lattice-server binary (got ${JSON.stringify(binary)})\n`);
  process.exit(1);
}

runAction({
  env: process.env,
  provision: ({ port, workDir, pidFile }) => startServer({ binary, port, workDir, pidFile }),
}).catch((e) => {
  process.stdout.write(`::error::AutoRepoRAG failed: ${e.message}\n`);
  console.error(e.stack || String(e));
  process.exit(1);
});
