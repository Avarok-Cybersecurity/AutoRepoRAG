#!/usr/bin/env node
// source-dir-check.mjs — prove a source-dir corpus is stamped with the
// EXTERNAL checkout's identity, not the workflow repo's.
//
// Independent of src/ on purpose (imports nothing from it): a bug in the
// action's own parsing must not be able to vouch for itself.
//
// Asserts, for a corpus built with `source-dir`:
//   - the corpus has at least one point and the header's count matches;
//   - EVERY point's payload.repo / payload.commit_sha equal the expected ones;
//   - every payload.path is a file inside the external checkout (so the
//     chunks really came from there, not from the workflow's workspace);
//   - meta.json's repo / commit_sha agree.
//
// Usage: node test/source-dir-check.mjs <corpus.jsonl> <meta.json> <owner/name> <commit-sha> <source-root>

import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, normalize } from 'node:path';

function fail(msg) {
  process.stderr.write(`source-dir-check: FAIL: ${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length !== 5) {
  process.stderr.write(
    'usage: node test/source-dir-check.mjs <corpus.jsonl> <meta.json> <owner/name> <commit-sha> <source-root>\n',
  );
  process.exit(2);
}
const [corpusFile, metaFile, wantRepo, wantSha, sourceRoot] = args;
for (const f of [corpusFile, metaFile, sourceRoot]) if (!existsSync(f)) fail(`no such path: ${f}`);
if (!/^[0-9a-f]{40}$/.test(wantSha)) fail(`expected commit must be a full sha, got ${JSON.stringify(wantSha)}`);

const lines = readFileSync(corpusFile, 'utf8').split('\n').filter((l) => l !== '');
if (lines.length < 2) fail(`${corpusFile} has no points`);
const header = JSON.parse(lines[0]);
if (header.t !== 'header') fail(`line 1 is not a header (t=${JSON.stringify(header.t)})`);

const paths = new Set();
let points = 0;
for (let i = 1; i < lines.length; i++) {
  const obj = JSON.parse(lines[i]);
  if (obj.t !== 'point') continue;
  points += 1;
  const { repo, commit_sha: sha, path } = obj.payload ?? {};
  if (repo !== wantRepo) fail(`point id ${obj.id}: payload.repo ${JSON.stringify(repo)} != ${JSON.stringify(wantRepo)}`);
  if (sha !== wantSha) fail(`point id ${obj.id}: payload.commit_sha ${JSON.stringify(sha)} != ${wantSha}`);
  if (typeof path !== 'string' || isAbsolute(path) || normalize(path).startsWith('..')) {
    fail(`point id ${obj.id}: payload.path ${JSON.stringify(path)} is not a relative in-tree path`);
  }
  paths.add(path);
}
if (points === 0) fail('corpus has a header but no points');
if (header.points !== points) fail(`header.points ${header.points} != ${points} point lines`);

for (const p of paths) {
  const abs = join(sourceRoot, p);
  if (!existsSync(abs) || !statSync(abs).isFile()) fail(`payload.path ${p} is not a file in ${sourceRoot}`);
}

const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
if (meta.repo !== wantRepo) fail(`meta.repo ${JSON.stringify(meta.repo)} != ${JSON.stringify(wantRepo)}`);
if (meta.commit_sha !== wantSha) fail(`meta.commit_sha ${JSON.stringify(meta.commit_sha)} != ${wantSha}`);

process.stdout.write(
  `source-dir-check: OK: ${points} points from ${paths.size} files, all ${wantRepo} @ ${wantSha}\n`,
);
