// git.test.mjs — source-dir resolution and repo/commit derivation, against
// real throwaway git repositories (no mocked git).

import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { gitContext, parseRemoteRepo, resolveSourceRoot } from '../../src/git.mjs';

// Fixture repos must not inherit the developer's git config (signing, hooks).
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_NOSYSTEM = '1';

const SCRATCH = mkdtempSync(join(tmpdir(), 'autoreporag-git-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const HOST_ENV = { GITHUB_SHA: 'f'.repeat(40), GITHUB_REPOSITORY: 'host-org/host-repo' };

function git(dir, ...args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** A git repo at <dir> with one commit; returns its HEAD sha. */
function initRepo(dir, { remote, commit = true } = {}) {
  mkdirSync(dir, { recursive: true });
  git(dir, 'init', '-q');
  if (remote) git(dir, 'remote', 'add', 'origin', remote);
  if (!commit) return '';
  writeFileSync(join(dir, 'lib.rs'), 'fn main() {}\n');
  git(dir, 'add', 'lib.rs');
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-q', '-m', 'c');
  return git(dir, 'rev-parse', 'HEAD');
}

function workspace(name) {
  const ws = join(SCRATCH, name);
  mkdirSync(ws, { recursive: true });
  return ws;
}

describe('parseRemoteRepo', () => {
  const cases = [
    ['https://github.com/Avarok-Cybersecurity/lattice-db', 'Avarok-Cybersecurity/lattice-db'],
    ['https://github.com/Avarok-Cybersecurity/lattice-db.git', 'Avarok-Cybersecurity/lattice-db'],
    ['https://github.com/o/r/', 'o/r'],
    ['https://x-access-token:secret@github.com/o/r.git', 'o/r'],
    ['ssh://git@github.com/o/r.git', 'o/r'],
    ['ssh://git@github.com:22/o/r.git', 'o/r'],
    ['git@github.com:o/r.git', 'o/r'],
    ['git@github.com:o/my.repo', 'o/my.repo'],
  ];
  for (const [url, want] of cases) {
    it(`${url} -> ${want}`, () => assert.equal(parseRemoteRepo(url), want));
  }

  for (const bad of ['https://gitlab.com/group/sub/r.git', 'https://github.com/o', '/srv/git/r.git', 'r', 'git@github.com:/abs/r']) {
    it(`rejects ${bad}`, () => assert.throws(() => parseRemoteRepo(bad), /cannot derive "owner\/name"/));
  }

  it('never echoes credentials in its error', () => {
    assert.throws(
      () => parseRemoteRepo('https://user:hunter2@example.com/a/b/c'),
      (e) => !e.message.includes('hunter2') && e.message.includes('***@'),
    );
  });
});

describe('resolveSourceRoot', () => {
  it("'' is the workspace", () => assert.equal(resolveSourceRoot('/ws', ''), '/ws'));
  it('joins a relative dir', () => assert.equal(resolveSourceRoot('/ws', '.sources/lattice-db'), '/ws/.sources/lattice-db'));
  it('rejects an absolute dir', () => assert.throws(() => resolveSourceRoot('/ws', '/etc'), /relative to the workspace/));
  for (const esc of ['..', '../x', 'a/../../x']) {
    it(`rejects escaping ${esc}`, () => assert.throws(() => resolveSourceRoot('/ws', esc), /stay inside the workspace/));
  }
});

describe('gitContext with source-dir', () => {
  it("derives repo and commit from the checkout, ignoring the workflow's GITHUB_* identity", () => {
    const ws = workspace('ok');
    const sha = initRepo(join(ws, '.sources', 'ext'), { remote: 'https://github.com/ext-org/ext-repo' });
    const ctx = gitContext(ws, '.sources/ext', HOST_ENV);
    assert.deepEqual(ctx, { root: join(ws, '.sources', 'ext'), commitSha: sha, repo: 'ext-org/ext-repo' });
  });

  it('refuses a directory that is not a git checkout', () => {
    const ws = workspace('plain');
    mkdirSync(join(ws, 'src'));
    assert.throws(() => gitContext(ws, 'src', HOST_ENV), /source-dir "src" is not a git checkout/);
  });

  it('refuses a subdirectory of another checkout (it would inherit that repo)', () => {
    const ws = workspace('nested');
    initRepo(ws, { remote: 'https://github.com/host-org/host-repo' });
    mkdirSync(join(ws, 'docs'));
    assert.throws(() => gitContext(ws, 'docs', HOST_ENV), /source-dir "docs" is not the root of a git checkout/);
  });

  it('refuses a missing directory', () => {
    assert.throws(() => gitContext(workspace('missing'), 'nope', HOST_ENV), /source-dir "nope" does not exist/);
  });

  it('refuses a checkout without remote.origin.url', () => {
    const ws = workspace('noremote');
    initRepo(join(ws, 'ext'));
    assert.throws(() => gitContext(ws, 'ext', HOST_ENV), /source-dir "ext" has no remote.origin.url/);
  });

  it('refuses a checkout without a commit', () => {
    const ws = workspace('empty');
    initRepo(join(ws, 'ext'), { remote: 'https://github.com/o/r', commit: false });
    assert.throws(() => gitContext(ws, 'ext', HOST_ENV), /source-dir "ext": cannot resolve HEAD to a commit/);
  });
});

describe('gitContext without source-dir (v1 behaviour)', () => {
  it("uses the workflow's GITHUB_SHA / GITHUB_REPOSITORY", () => {
    const ws = workspace('v1-env');
    initRepo(ws, { remote: 'https://github.com/other/other' });
    assert.deepEqual(gitContext(ws, '', HOST_ENV), { root: ws, commitSha: HOST_ENV.GITHUB_SHA, repo: 'host-org/host-repo' });
  });

  it('falls back to the checkout when those are unset', () => {
    const ws = workspace('v1-git');
    const sha = initRepo(ws, { remote: 'git@github.com:o/r.git' });
    assert.deepEqual(gitContext(ws, '', {}), { root: ws, commitSha: sha, repo: 'o/r' });
  });
});
