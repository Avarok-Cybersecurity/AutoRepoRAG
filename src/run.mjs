// run.mjs — the AutoRepoRAG pipeline, with its I/O and lattice-server injected.
//
// Contract: takes the parsed run configuration (src/run-config.mjs), the io
// port (src/adapters/node-io.mjs in production) and a lattice-server
// provisioner. Resolves the source (a git checkout, or files-dir with
// corpus-repo / corpus-commit), starts a lattice-server through `provision`,
// builds the corpus there (src/corpus.mjs v2, src/site-corpus.mjs v3), writes
// the lattice-jsonl corpus + gzip -9 twin + snapshot (v3, when asked) +
// meta.json, emits the website-chat bundle when asked, and the GITHUB_OUTPUT
// / GITHUB_STEP_SUMMARY entries. Every file, network, git and clock access
// goes through `io`. src/main.mjs passes the release provisioner (download +
// sha256-verify); a test harness may pass one that starts a locally built
// binary. Throws on any failure.

import { isAbsolute, join, resolve } from 'node:path';

import { buildRepoCorpus } from './corpus.mjs';
import { buildMeta } from './meta.mjs';
import { resolveSourceRoot } from './paths.mjs';
import { buildSiteCorpus } from './site-corpus.mjs';
import { gzip9, log, sha256Hex } from './util.mjs';

/** Resolve a JSON input file (absolute, or relative to the workspace) and parse it, naming the input on failure. */
export function jsonFileReader(workspace, fs) {
  return (path, inputName) => {
    const abs = isAbsolute(path) ? path : resolve(workspace, path);
    let text;
    try {
      text = fs.readText(abs);
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
function resolveSource(inputs, workspace, io) {
  if (inputs.v3?.filesDir) {
    const root = resolveSourceRoot(workspace, inputs.v3.filesDir);
    if (!io.fs.isDirectory(root)) {
      throw new Error(`files-dir ${JSON.stringify(inputs.v3.filesDir)} is not a directory in the workspace`);
    }
    log(`[source] files-dir ${inputs.v3.filesDir}: ${inputs.v3.corpusRepo} @ ${inputs.v3.corpusCommit}`);
    return { root, repo: inputs.v3.corpusRepo, commitSha: inputs.v3.corpusCommit };
  }
  const source = io.gitContext(workspace, inputs.sourceDir);
  if (inputs.sourceDir) log(`[source] ${inputs.sourceDir}: ${source.repo} @ ${source.commitSha}`);
  return source;
}

/**
 * @param {{config: ReturnType<typeof import('./run-config.mjs').readRunConfig>,
 *   io: import('./adapters/node-io.mjs').Io,
 *   provision: (opts: {version: string, port: number, workDir: string, pidFile: string}) =>
 *     Promise<{baseUrl: string, stop: () => Promise<void>}>}} deps
 */
export async function runAction({ config, io, provision }) {
  const { inputs, workspace, tempBase, actionVersion } = config;
  const source = resolveSource(inputs, workspace, io);
  const outputDir = isAbsolute(inputs.outputDir) ? inputs.outputDir : resolve(workspace, inputs.outputDir);
  io.fs.mkdirp(outputDir);
  io.fs.mkdirp(tempBase);
  const server = await provision({
    version: inputs.latticeVersion,
    port: inputs.latticePort,
    workDir: join(tempBase, 'autoreporag'),
    pidFile: join(tempBase, 'autoreporag-lattice.pid'),
  });
  try {
    const client = io.latticeClient(server.baseUrl);
    const built = inputs.v3
      ? await buildSiteCorpus({ inputs, client, source, readJson: jsonFileReader(workspace, io.fs), io })
      : await buildRepoCorpus({ inputs, client, source, io });

    const out = (ext) => join(outputDir, `${inputs.outputName}${ext}`);
    const { corpusText } = built;
    io.fs.writeFile(out('.jsonl'), corpusText);
    const bytes = Buffer.byteLength(corpusText);
    const sha256 = sha256Hex(corpusText);
    let gzBytes = 0;
    if (inputs.gzip) {
      const gz = gzip9(Buffer.from(corpusText));
      io.fs.writeFile(out('.jsonl.gz'), gz);
      gzBytes = gz.length;
    }
    let snapshotSha256 = null;
    if (built.snapshotBytes) {
      io.fs.writeFile(out('.lattice'), built.snapshotBytes);
      snapshotSha256 = sha256Hex(built.snapshotBytes);
    }
    const meta = buildMeta({
      inputs, built, source, bytes, gzBytes, sha256, snapshotSha256,
      generatedAt: io.clock.isoNow(), actionVersion,
    });
    io.fs.writeFile(out('.meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

    let chatDir = '';
    if (inputs.generateWebsiteChat) {
      ({ dir: chatDir } = await io.emitWebsiteChat({
        outDir: join(outputDir, inputs.websiteChatDir),
        latticeVersion: inputs.latticeVersion,
        cacheDir: join(tempBase, 'autoreporag', 'lattice-wasm'),
      }));
    }

    const files = {
      corpus: out('.jsonl'),
      gz: inputs.gzip ? out('.jsonl.gz') : '',
      snapshot: built.snapshotBytes ? out('.lattice') : '',
      meta: out('.meta.json'),
    };
    io.github.setOutput('corpus-file', files.corpus);
    io.github.setOutput('corpus-gz-file', files.gz);
    io.github.setOutput('metadata-file', files.meta);
    io.github.setOutput('dim', String(built.dim));
    io.github.setOutput('points', String(built.points));
    io.github.setOutput('embedded', String(built.embedded));
    io.github.setOutput('reused', String(built.reused));
    io.github.setOutput('sha256', sha256);
    io.github.setOutput('website-chat-dir', chatDir);
    io.github.setOutput('snapshot-file', files.snapshot);
    io.github.setOutput('edges', String(built.edges));
    io.github.writeSummary({ built, meta, files, chatDir });
    log(`[done] ${files.corpus} (${bytes} B, sha256 ${sha256})`);
    return { files, meta };
  } finally {
    await server.stop();
  }
}
