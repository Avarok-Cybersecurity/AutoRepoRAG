// run.mjs — the AutoRepoRAG pipeline, with its lattice-server injected.
//
// Contract: reads composite-action inputs from `env` (INPUT_* vars),
// resolves the source (a git checkout, or files-dir with corpus-repo /
// corpus-commit), starts a lattice-server through `provision`, builds the
// corpus there (src/corpus.mjs v2, src/site-corpus.mjs v3), writes the
// lattice-jsonl corpus + gzip -9 twin + snapshot (v3, when asked) +
// meta.json, emits the website-chat bundle when asked, and the
// GITHUB_OUTPUT / GITHUB_STEP_SUMMARY entries. src/main.mjs passes the
// release provisioner (download + sha256-verify); a test harness may pass
// one that starts a locally built binary. Throws on any failure.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

import { buildRepoCorpus } from './corpus.mjs';
import { gitContext, resolveSourceRoot } from './git.mjs';
import { readInputs } from './inputs.mjs';
import { LatticeClient } from './lattice.mjs';
import { buildMeta } from './meta.mjs';
import { setOutput, writeSummary } from './outputs.mjs';
import { buildSiteCorpus } from './site-corpus.mjs';
import { addMask, getInput, gzip9, log, sha256Hex } from './util.mjs';
import { emitWebsiteChat, LIBRARY_DIR } from './website-chat.mjs';

/** Resolve a JSON input file (absolute, or relative to the workspace) and parse it, naming the input on failure. */
export function jsonFileReader(workspace) {
  return (path, inputName) => {
    const abs = isAbsolute(path) ? path : resolve(workspace, path);
    let text;
    try {
      text = readFileSync(abs, 'utf8');
    } catch (e) {
      throw new Error(`${inputName} ${JSON.stringify(path)} cannot be read (${e.code ?? e.message})`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`${inputName} ${JSON.stringify(path)} is not valid JSON: ${e.message}`);
    }
  };
}

/** Where the chunked files live and which repo/commit they are. */
function resolveSource(inputs, workspace, env) {
  if (inputs.v3?.filesDir) {
    const root = resolveSourceRoot(workspace, inputs.v3.filesDir);
    if (!existsSync(root) || !statSync(root).isDirectory()) {
      throw new Error(`files-dir ${JSON.stringify(inputs.v3.filesDir)} is not a directory in the workspace`);
    }
    log(`[source] files-dir ${inputs.v3.filesDir}: ${inputs.v3.corpusRepo} @ ${inputs.v3.corpusCommit}`);
    return { root, repo: inputs.v3.corpusRepo, commitSha: inputs.v3.corpusCommit };
  }
  const source = gitContext(workspace, inputs.sourceDir, env);
  if (inputs.sourceDir) log(`[source] ${inputs.sourceDir}: ${source.repo} @ ${source.commitSha}`);
  return source;
}

/**
 * @param {{env: Record<string, string|undefined>,
 *   provision: (opts: {version: string, port: number, workDir: string, pidFile: string}) =>
 *     Promise<{baseUrl: string, stop: () => Promise<void>}>}} deps
 */
export async function runAction({ env, provision }) {
  addMask(getInput(env, 'embedding-api-key')); // before any other output
  const inputs = readInputs(env);
  const workspace = env.GITHUB_WORKSPACE || process.cwd();
  const source = resolveSource(inputs, workspace, env);
  const outputDir = isAbsolute(inputs.outputDir) ? inputs.outputDir : resolve(workspace, inputs.outputDir);
  mkdirSync(outputDir, { recursive: true });
  const tempBase = env.RUNNER_TEMP || resolve(workspace, '.work');
  mkdirSync(tempBase, { recursive: true });

  const server = await provision({
    version: inputs.latticeVersion,
    port: inputs.latticePort,
    workDir: join(tempBase, 'autoreporag'),
    pidFile: join(tempBase, 'autoreporag-lattice.pid'),
  });
  try {
    const client = new LatticeClient(server.baseUrl);
    const built = inputs.v3
      ? await buildSiteCorpus({ inputs, client, source, readJson: jsonFileReader(workspace) })
      : await buildRepoCorpus({ inputs, client, source });

    const out = (ext) => join(outputDir, `${inputs.outputName}${ext}`);
    const { corpusText } = built;
    writeFileSync(out('.jsonl'), corpusText);
    const bytes = Buffer.byteLength(corpusText);
    const sha256 = sha256Hex(corpusText);
    let gzBytes = 0;
    if (inputs.gzip) {
      const gz = gzip9(Buffer.from(corpusText));
      writeFileSync(out('.jsonl.gz'), gz);
      gzBytes = gz.length;
    }
    let snapshotSha256 = null;
    if (built.snapshotBytes) {
      writeFileSync(out('.lattice'), built.snapshotBytes);
      snapshotSha256 = sha256Hex(built.snapshotBytes);
    }
    const meta = buildMeta({
      inputs, built, source, bytes, gzBytes, sha256, snapshotSha256,
      generatedAt: new Date().toISOString(), actionVersion: env.GITHUB_ACTION_REF || 'local',
    });
    writeFileSync(out('.meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

    let chatDir = '';
    if (inputs.generateWebsiteChat) {
      ({ dir: chatDir } = await emitWebsiteChat({
        outDir: join(outputDir, inputs.websiteChatDir),
        latticeVersion: inputs.latticeVersion,
        cacheDir: join(tempBase, 'autoreporag', 'lattice-wasm'),
        libraryDir: LIBRARY_DIR,
      }));
    }

    const files = {
      corpus: out('.jsonl'),
      gz: inputs.gzip ? out('.jsonl.gz') : '',
      snapshot: built.snapshotBytes ? out('.lattice') : '',
      meta: out('.meta.json'),
    };
    setOutput('corpus-file', files.corpus);
    setOutput('corpus-gz-file', files.gz);
    setOutput('metadata-file', files.meta);
    setOutput('dim', String(built.dim));
    setOutput('points', String(built.points));
    setOutput('embedded', String(built.embedded));
    setOutput('reused', String(built.reused));
    setOutput('sha256', sha256);
    setOutput('website-chat-dir', chatDir);
    setOutput('snapshot-file', files.snapshot);
    setOutput('edges', String(built.edges));
    writeSummary({ built, meta, files, chatDir });
    log(`[done] ${files.corpus} (${bytes} B, sha256 ${sha256})`);
    return { files, meta };
  } finally {
    await server.stop();
  }
}
