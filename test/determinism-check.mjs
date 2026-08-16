#!/usr/bin/env node
// determinism-check.mjs — byte-determinism gate for the AutoRepoRAG pipeline.
//
// Two modes:
//   0 args — self-run: run the pipeline TWICE in mock mode (below);
//   2 args — compare: byte-compare two already-built corpus files (plus their
//            .gz twins when present) and exit; this is what CI uses so the
//            job does not re-run the whole pipeline a third and fourth time.
//
// Self-run mode runs the pipeline TWICE in mock mode against test/fixtures, each run a real
// child process of src/main.mjs (end-to-end, exactly as the composite action
// invokes it: INPUT_* env crossing, real downloaded lattice-server spawned on
// a DIFFERENT loopback port per run, upsert + verify + export). Asserts the
// two corpus .jsonl files — and their .gz twins — are byte-identical.
// meta.json is deliberately excluded (generated_at is wall-clock).
//
// Usage: node test/determinism-check.mjs [corpusA.jsonl corpusB.jsonl]
// Env:   AUTORAG_TEST_PORT (base port, default 6451; run2 uses base+1)
//        AUTORAG_LATTICE_VERSION (default v0.3.3)

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const MAIN = join(REPO, 'src', 'main.mjs');
const FIXTURES = join(HERE, 'fixtures');

const BASE_PORT = Number(process.env.AUTORAG_TEST_PORT || 6451);
const LATTICE_VERSION = process.env.AUTORAG_LATTICE_VERSION || 'v0.3.3';
// Fixed identity: the fixture tree is not its own git repo, and determinism
// requires an input-stable commit_sha across both runs.
const FIXED_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const FIXED_REPO = 'Avarok-Cybersecurity/AutoRepoRAG-fixtures';

function fail(msg) {
  process.stderr.write(`determinism-check: FAIL: ${msg}\n`);
  process.exit(1);
}

/** Inherited env minus anything that could steer main.mjs, plus our inputs. */
function buildEnv({ outDir, runnerTemp, githubOutput, port }) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('INPUT_') || k.startsWith('GITHUB_') || k === 'RUNNER_TEMP') continue;
    env[k] = v;
  }
  const inputs = {
    paths: 'src/**/*.rs\nkernels/**',
    exclude: '',
    collection: 'coderag',
    'output-dir': outDir,
    'output-name': 'coderag',
    gzip: 'true',
    'embedding-endpoint': '',
    'embedding-model': '',
    'embedding-api-key': '',
    'mock-embeddings': 'true',
    'mock-dim': '32',
    'chunk-lines': '40',
    'chunk-overlap': '8',
    'max-chunk-bytes': '16384',
    'batch-size': '32',
    'request-interval-ms': '0',
    'max-retries': '3',
    'max-chunks': '0',
    'vector-precision': '6',
    'previous-corpus-url': '',
    'lattice-version': LATTICE_VERSION,
    'lattice-port': String(port),
  };
  for (const [name, value] of Object.entries(inputs)) {
    env[`INPUT_${name.replace(/-/g, '_').toUpperCase()}`] = value;
  }
  env.GITHUB_WORKSPACE = FIXTURES;
  env.GITHUB_SHA = FIXED_SHA;
  env.GITHUB_REPOSITORY = FIXED_REPO;
  env.RUNNER_TEMP = runnerTemp;
  env.GITHUB_OUTPUT = githubOutput;
  return env;
}

/** Parse GITHUB_OUTPUT text: heredoc `name<<DELIM` blocks and name=value lines. */
function parseGithubOutput(text) {
  const outputs = {};
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const heredoc = /^(.+?)<<(.+)$/.exec(lines[i]);
    if (heredoc) {
      const [, name, delim] = heredoc;
      const value = [];
      i += 1;
      while (i < lines.length && lines[i] !== delim) {
        value.push(lines[i]);
        i += 1;
      }
      if (i >= lines.length) fail(`GITHUB_OUTPUT heredoc for ${name} missing closing delimiter ${delim}`);
      outputs[name] = value.join('\n');
      continue;
    }
    const eq = lines[i].indexOf('=');
    if (eq > 0) outputs[lines[i].slice(0, eq)] = lines[i].slice(eq + 1);
  }
  return outputs;
}

function runPipeline(label, scratch, port) {
  const outDir = join(scratch, `${label}-out`);
  const runnerTemp = join(scratch, `${label}-temp`);
  const githubOutput = join(runnerTemp, 'github-output.txt');
  mkdirSync(outDir, { recursive: true });
  mkdirSync(runnerTemp, { recursive: true });

  process.stdout.write(`\n--- ${label}: node src/main.mjs (port ${port}) ---\n`);
  const res = spawnSync(process.execPath, [MAIN], {
    env: buildEnv({ outDir, runnerTemp, githubOutput, port }),
    stdio: 'inherit',
    timeout: 600_000,
  });
  if (res.error) fail(`${label}: spawn failed: ${res.error.message}`);
  if (res.status !== 0) fail(`${label}: main.mjs exited ${res.status}`);

  const outputs = parseGithubOutput(readFileSync(githubOutput, 'utf8'));
  return {
    corpus: readFileSync(join(outDir, 'coderag.jsonl')),
    gz: readFileSync(join(outDir, 'coderag.jsonl.gz')),
    outputs,
  };
}

function main() {
  const scratch = mkdtempSync(join(process.env.RUNNER_TEMP || tmpdir(), 'autoreporag-det-'));
  let a;
  let b;
  try {
    a = runPipeline('run1', scratch, BASE_PORT);
    b = runPipeline('run2', scratch, BASE_PORT + 1);

    if (a.outputs.points !== b.outputs.points) {
      fail(`points differ: run1=${a.outputs.points} run2=${b.outputs.points}`);
    }
    if (!a.corpus.equals(b.corpus)) {
      fail(
        `corpus .jsonl differs between runs (run1 ${a.corpus.length} B sha ${a.outputs.sha256}, ` +
          `run2 ${b.corpus.length} B sha ${b.outputs.sha256})`,
      );
    }
    if (a.outputs.sha256 !== b.outputs.sha256) {
      fail(`GITHUB_OUTPUT sha256 differs despite identical bytes: ${a.outputs.sha256} vs ${b.outputs.sha256}`);
    }
    if (!a.gz.equals(b.gz)) {
      fail(`corpus .jsonl.gz differs between runs (${a.gz.length} B vs ${b.gz.length} B)`);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  process.stdout.write(
    `\ndeterminism-check: OK: two end-to-end main.mjs runs (ports ${BASE_PORT}/${BASE_PORT + 1}) ` +
      `produced byte-identical corpus (${a.corpus.length} B, sha256 ${a.outputs.sha256}) ` +
      `and gz twin (${a.gz.length} B), ${a.outputs.points} points\n`,
  );
}

/** 2-arg mode: byte-compare two corpus files (+ .gz twins when present). */
function compareMode(fileA, fileB) {
  for (const f of [fileA, fileB]) {
    if (!existsSync(f)) fail(`no such file: ${f}`);
  }
  const a = readFileSync(fileA);
  const b = readFileSync(fileB);
  if (!a.equals(b)) {
    fail(`corpus files differ: ${fileA} (${a.length} B) vs ${fileB} (${b.length} B)`);
  }
  const gzA = `${fileA}.gz`;
  const gzB = `${fileB}.gz`;
  let gzNote = 'no .gz twins';
  if (existsSync(gzA) !== existsSync(gzB)) {
    fail(`.gz twin presence differs: ${gzA} ${existsSync(gzA) ? 'exists' : 'missing'}, ${gzB} ${existsSync(gzB) ? 'exists' : 'missing'}`);
  }
  if (existsSync(gzA)) {
    const ga = readFileSync(gzA);
    const gb = readFileSync(gzB);
    if (!ga.equals(gb)) {
      fail(`.gz twins differ: ${gzA} (${ga.length} B) vs ${gzB} (${gb.length} B)`);
    }
    gzNote = `.gz twins byte-identical (${ga.length} B)`;
  }
  process.stdout.write(
    `determinism-check: OK: ${fileA} and ${fileB} are byte-identical (${a.length} B), ${gzNote}\n`,
  );
}

const args = process.argv.slice(2);
if (args.length === 2) {
  compareMode(args[0], args[1]);
} else if (args.length === 0) {
  main();
} else {
  process.stderr.write(
    'usage: node test/determinism-check.mjs [corpusA.jsonl corpusB.jsonl]\n' +
      '  0 args: self-run the pipeline twice and compare\n' +
      '  2 args: byte-compare two existing corpus files (+ .gz twins)\n',
  );
  process.exit(2);
}
