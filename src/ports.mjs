// ports.mjs — the ports the pipeline's core depends on. Declarations only.
//
// Contract: the core (run, corpus, site-corpus, chunk, vectors, embed,
// snapshot, verify, verify-v3) names these types and calls methods on what
// it is handed; it never constructs or imports an implementation. The node
// implementations are src/adapters/node-io.mjs (Io) and
// src/adapters/lattice-http.mjs (LatticeStore); src/main.mjs wires them in.

/**
 * The lattice-server collection API the core needs.
 * @typedef {{
 *   createCollection: (name: string, dim: number) => Promise<unknown>,
 *   createCollectionFrom: (name: string, body: object) => Promise<unknown>,
 *   deleteCollection: (name: string) => Promise<unknown>,
 *   collectionInfo: (name: string) => Promise<{points_count: number}>,
 *   upsertBatch: (name: string, points: object[]) => Promise<unknown>,
 *   addEdge: (name: string, edge: {from: number, to: number, rel: string, w: number}) => Promise<unknown>,
 *   search: (name: string, vector: number[], limit: number) => Promise<Array<{id: number, score: number}>>,
 *   query: (name: string, body: object) => Promise<{points: Array<{id: number, score: number}>}>,
 *   scroll: (name: string, opts: {limit: number}) => Promise<{points: object[]}>,
 *   scrollAll: (name: string, opts: {pageSize: number, withPayload: boolean, withVector: boolean}) => Promise<object[]>,
 *   exportSnapshot: (name: string) => Promise<Buffer>,
 *   importSnapshot: (name: string, bytes: Buffer, mode: string) => Promise<unknown>,
 * }} LatticeStore
 */

/** @typedef {{nowMs: () => number, isoNow: () => string, sleep: (ms: number) => Promise<void>}} Clock */

/**
 * Every other way the core reaches the outside world.
 * @typedef {{
 *   fs: {readText: (path: string) => string, readBytes: (path: string) => Buffer, exists: (path: string) => boolean,
 *     isDirectory: (path: string) => boolean, mkdirp: (path: string) => void,
 *     writeFile: (path: string, data: string|Buffer) => void},
 *   listFiles: (root: string, listing: 'git'|'walk') => string[],
 *   readUrl: (url: string) => Promise<Buffer>,
 *   http: (url: string, init: object) => Promise<Response>,
 *   clock: Clock,
 *   latticeClient: (baseUrl: string) => LatticeStore,
 *   gitContext: (workspace: string, sourceDir: string) => {root: string, commitSha: string, repo: string},
 *   emitWebsiteChat: (opts: {outDir: string, latticeVersion: string, cacheDir: string}) => Promise<{dir: string}>,
 *   github: {setOutput: (name: string, value: string) => void, writeSummary: (summary: object) => void},
 * }} Io
 */

export {};
