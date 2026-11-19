// github.mjs — the GitHub runner adapter: step outputs, the step summary and
// the log scrubber's ::add-mask::. Each takes the env map it reads from, so
// the composition root (src/main.mjs) decides which environment is used.

import { appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

/**
 * Append to the file named by a GitHub env var (GITHUB_OUTPUT /
 * GITHUB_STEP_SUMMARY). Returns false when the env var is unset: outside
 * Actions there is no such file, and nothing reads the outputs.
 */
function appendGithubFile(env, envVar, text) {
  const path = env[envVar];
  if (!path) return false;
  appendFileSync(path, text);
  return true;
}

/**
 * Register a secret with the runner's log scrubber. Call before any other output.
 * Only the GitHub runner consumes `::add-mask::`; anywhere else the command would
 * itself PRINT the secret, so outside Actions this is a no-op.
 */
export function addMask(env, value) {
  if (value && env.GITHUB_ACTIONS === 'true') {
    process.stdout.write(`::add-mask::${value}\n`);
  }
}

/**
 * Emit a step output in the `name<<DELIM` heredoc form. The plain name=value
 * form is injectable: a user-controlled value (output-dir, output-name feed
 * into paths) containing a newline would define extra outputs.
 */
export function setOutput(env, name, value) {
  if (/[\r\n]/.test(name)) throw new Error(`output name ${JSON.stringify(name)} contains a newline`);
  const delim = `ghadelim_${randomBytes(16).toString('hex')}`;
  const text = String(value);
  if (text.includes(delim)) throw new Error(`output value for ${name} collides with delimiter ${delim}`);
  appendGithubFile(env, 'GITHUB_OUTPUT', `${name}<<${delim}\n${text}\n${delim}\n`);
}

/** The step summary table (GITHUB_STEP_SUMMARY; a no-op outside Actions). */
export function writeSummary(env, { built, meta, files, chatDir }) {
  const sized = (n) => `${n} B`;
  appendGithubFile(
    env,
    'GITHUB_STEP_SUMMARY',
    [
      '### AutoRepoRAG corpus',
      '',
      '| metric | value |',
      '|---|---|',
      `| points | ${built.points} |`,
      `| files | ${built.fileCount} |`,
      `| dim | ${built.dim} |`,
      `| embedded / reused | ${built.embedded} / ${built.reused} |`,
      `| model | \`${meta.model}\` |`,
      `| commit | \`${meta.commit_sha}\` |`,
      `| corpus | \`${files.corpus}\` (${sized(meta.bytes)}${meta.gz_bytes ? `, ${sized(meta.gz_bytes)} gz` : ''}) |`,
      `| sha256 | \`${meta.sha256}\` |`,
      ...(meta.search_mode ? [`| search mode / chunking | ${meta.search_mode} / ${meta.chunk_strategy} |`, `| edges | ${meta.edges} |`] : []),
      ...(files.snapshot ? [`| snapshot | \`${files.snapshot}\` (${sized(meta.snapshot_bytes)}, format ${meta.snapshot_format}) |`] : []),
      ...(chatDir ? [`| website chat | \`${chatDir}\` |`] : []),
      '',
    ].join('\n'),
  );
}
