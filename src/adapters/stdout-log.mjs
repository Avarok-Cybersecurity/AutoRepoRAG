// stdout-log.mjs — the log facade's sink for a GitHub runner: stdout, where
// the runner reads ::warning:: lines.

/** @param {string} text */
export function stdoutSink(text) {
  process.stdout.write(text);
}
