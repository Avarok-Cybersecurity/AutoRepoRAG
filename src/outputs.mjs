// outputs.mjs — GitHub step outputs and the step summary.

import { randomBytes } from 'node:crypto';

import { appendGithubFile } from './util.mjs';

/**
 * Emit a step output in the `name<<DELIM` heredoc form. The plain name=value
 * form is injectable: a user-controlled value (output-dir, output-name feed
 * into paths) containing a newline would define extra outputs.
 */
export function setOutput(name, value) {
  if (/[\r\n]/.test(name)) throw new Error(`output name ${JSON.stringify(name)} contains a newline`);
  const delim = `ghadelim_${randomBytes(16).toString('hex')}`;
  const text = String(value);
  if (text.includes(delim)) throw new Error(`output value for ${name} collides with delimiter ${delim}`);
  appendGithubFile('GITHUB_OUTPUT', `${name}<<${delim}\n${text}\n${delim}\n`);
}

/** The step summary table (GITHUB_STEP_SUMMARY; a no-op outside Actions). */
export function writeSummary({ built, meta, files, chatDir }) {
  const sized = (n) => `${n} B`;
  appendGithubFile(
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
