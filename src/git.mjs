// git.mjs — where the chunked sources live and which repo/commit they are.
//
// Contract: resolveSourceRoot and parseRemoteRepo are pure. gitContext is the
// git adapter: without a source-dir it keeps the v1 behaviour (the workflow's
// own GITHUB_SHA / GITHUB_REPOSITORY, falling back to the checkout); with a
// source-dir it ignores those variables entirely (they describe the workflow
// repo, not the external checkout) and derives both from the checkout itself,
// refusing anything that is not the root of a git checkout.

import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { join } from 'node:path';

import { relativeInside } from './paths.mjs';

const NAME = /^[A-Za-z0-9_.-]+$/;
const FULL_SHA = /^[0-9a-f]{40}$/;

/** Join a workspace-relative source-dir onto the workspace; '' means the workspace itself. */
export function resolveSourceRoot(workspace, sourceDir) {
  if (sourceDir === '') return workspace;
  return join(workspace, relativeInside(sourceDir, 'source-dir', 'workspace'));
}

/** Strip any user:token@ so a remote URL can appear in an error message. */
function redact(url) {
  return url.replace(/\/\/[^/@]*@/, '//***@');
}

/**
 * Normalise a git remote URL to "owner/name". Accepts
 *   https://host/owner/name(.git)   (credentials in the authority allowed)
 *   ssh://git@host(:port)/owner/name(.git)
 *   git@host:owner/name(.git)       (scp-like)
 * and rejects anything whose path is not exactly two segments.
 */
export function parseRemoteRepo(url) {
  let path;
  const scheme = /^(?:https?|ssh|git):\/\/[^/]+\/(.*)$/.exec(url);
  const scp = /^[^/@:]+@[^/:]+:(?!\/)(.*)$/.exec(url);
  if (scheme) path = scheme[1];
  else if (scp) path = scp[1];
  else throw new Error(`cannot derive "owner/name" from remote ${JSON.stringify(redact(url))}: unrecognised URL form`);
  const parts = path.replace(/\/+$/, '').replace(/\.git$/, '').split('/');
  if (parts.length !== 2 || !parts.every((p) => NAME.test(p) && p !== '.' && p !== '..')) {
    throw new Error(`cannot derive "owner/name" from remote ${JSON.stringify(redact(url))}: path is not owner/name`);
  }
  return `${parts[0]}/${parts[1]}`;
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/** Like git(), but a failure becomes `what` plus git's own stderr. */
function gitOrThrow(root, args, what) {
  try {
    return git(root, args);
  } catch (e) {
    const stderr = String(e.stderr ?? '').trim();
    throw new Error(`${what}${stderr ? ` (git: ${stderr})` : ''}`);
  }
}

function externalContext(root, sourceDir) {
  const label = `source-dir ${JSON.stringify(sourceDir)}`;
  let realRoot;
  try {
    realRoot = realpathSync(root);
  } catch (e) {
    throw new Error(`${label} does not exist (${e.code ?? e.message})`);
  }
  const top = gitOrThrow(root, ['rev-parse', '--show-toplevel'], `${label} is not a git checkout`);
  if (realpathSync(top) !== realRoot) {
    throw new Error(`${label} is not the root of a git checkout (it lies inside ${top})`);
  }
  const commitSha = gitOrThrow(
    root, ['rev-parse', '--verify', 'HEAD^{commit}'], `${label}: cannot resolve HEAD to a commit`,
  );
  if (!FULL_SHA.test(commitSha)) throw new Error(`${label}: HEAD resolved to ${JSON.stringify(commitSha)}, not a sha`);
  const remote = gitOrThrow(
    root, ['config', '--get', 'remote.origin.url'], `${label} has no remote.origin.url to derive the repo from`,
  );
  return { commitSha, repo: parseRemoteRepo(remote) };
}

/**
 * The repo identity stamped on every chunk.
 * @param {string} workspace  GITHUB_WORKSPACE (or cwd for local runs)
 * @param {string} sourceDir  workspace-relative external checkout, '' for the workspace
 * @param {Record<string, string|undefined>} env  GITHUB_SHA / GITHUB_REPOSITORY source
 * @returns {{ root: string, commitSha: string, repo: string }}
 */
export function gitContext(workspace, sourceDir, env) {
  const root = resolveSourceRoot(workspace, sourceDir);
  if (sourceDir !== '') return { root, ...externalContext(root, sourceDir) };
  const commitSha = env.GITHUB_SHA || git(root, ['rev-parse', 'HEAD']);
  const repo = env.GITHUB_REPOSITORY || parseRemoteRepo(git(root, ['config', '--get', 'remote.origin.url']));
  return { root, commitSha, repo };
}
