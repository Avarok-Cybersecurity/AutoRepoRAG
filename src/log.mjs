// log.mjs — the logging facade the core writes progress and ::warning::
// lines through.
//
// Contract: log and warning format a line and hand it to the sink the
// entrypoint installed (installLogSink); this module performs no I/O.
// src/main.mjs installs the stdout sink (src/adapters/stdout-log.mjs).
// Logging before a sink is installed throws: a forgotten install would
// otherwise drop the ::warning:: lines a run's caller relies on.

/** @type {((text: string) => void) | null} */
let sink = null;

/** Route every log line to `next` (a function taking the line, newline included). */
export function installLogSink(next) {
  if (typeof next !== 'function') throw new Error('installLogSink needs a function');
  sink = next;
}

function emit(text) {
  if (sink === null) throw new Error('no log sink installed: the entrypoint must call installLogSink first');
  sink(text);
}

export function log(msg) {
  emit(`${msg}\n`);
}

export function warning(msg) {
  emit(`::warning::${msg}\n`);
}
