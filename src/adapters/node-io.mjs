// node-io.mjs — the node adapter for the io port the pipeline's core receives.
//
// Contract: nodeIo(env) returns the one object through which src/run.mjs and
// everything it calls reach the outside world: the filesystem, the network
// (previous-corpus URLs, embedding providers, the lattice-server REST API),
// git, the clock, the website-chat emitter and the GitHub runner files. Only
// the composition root (src/main.mjs) calls it; tests pass it, or a small
// in-memory object of the same shape, where the core asks for `io`.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { nodeClock } from './clock.mjs';
import { gitContext } from './git.mjs';
import { setOutput, writeSummary } from './github.mjs';
import { LatticeClient } from './lattice-http.mjs';
import { listFiles } from './list-files.mjs';
import { emitWebsiteChat, LIBRARY_DIR } from './website-chat.mjs';

/**
 * @typedef {{
 *   fs: {readText: (path: string) => string, readBytes: (path: string) => Buffer, exists: (path: string) => boolean,
 *     isDirectory: (path: string) => boolean, mkdirp: (path: string) => void,
 *     writeFile: (path: string, data: string|Buffer) => void},
 *   listFiles: (root: string, listing: 'git'|'walk') => string[],
 *   readUrl: (url: string) => Promise<Buffer>,
 *   http: typeof fetch,
 *   clock: {nowMs: () => number, isoNow: () => string, sleep: (ms: number) => Promise<void>},
 *   latticeClient: (baseUrl: string) => LatticeClient,
 *   gitContext: (workspace: string, sourceDir: string) => {root: string, commitSha: string, repo: string},
 *   emitWebsiteChat: (opts: {outDir: string, latticeVersion: string, cacheDir: string}) => Promise<{dir: string}>,
 *   github: {setOutput: (name: string, value: string) => void, writeSummary: (summary: object) => void},
 * }} Io
 */

/** A previous-corpus (or its meta.json) URL's bytes: file:// or http(s):// only. */
async function readUrl(url) {
  if (url.startsWith('file://')) return readFileSync(fileURLToPath(url));
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`previous corpus URLs must be file:// or http(s)://, got ${url}`);
}

/**
 * @param {Record<string, string|undefined>} env  the process environment (git identity, GitHub runner files)
 * @returns {Io}
 */
export function nodeIo(env) {
  return Object.freeze({
    fs: Object.freeze({
      readText: (path) => readFileSync(path, 'utf8'),
      readBytes: (path) => readFileSync(path),
      exists: (path) => existsSync(path),
      isDirectory: (path) => existsSync(path) && statSync(path).isDirectory(),
      mkdirp: (path) => {
        mkdirSync(path, { recursive: true });
      },
      writeFile: (path, data) => writeFileSync(path, data),
    }),
    listFiles,
    readUrl,
    http: (url, init) => fetch(url, init),
    clock: nodeClock,
    latticeClient: (baseUrl) => new LatticeClient(baseUrl),
    gitContext: (workspace, sourceDir) => gitContext(workspace, sourceDir, env),
    emitWebsiteChat: (opts) => emitWebsiteChat({ ...opts, libraryDir: LIBRARY_DIR }),
    github: Object.freeze({
      setOutput: (name, value) => setOutput(env, name, value),
      writeSummary: (summary) => writeSummary(env, summary),
    }),
  });
}
