// clock.mjs — the clock port's node adapter: wall time, monotonic-enough
// elapsed time and sleeping. Core code receives this object (io.clock) and
// never reads Date or setTimeout itself.

/** Resolve after `ms` milliseconds. */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @type {{nowMs: () => number, isoNow: () => string, sleep: (ms: number) => Promise<void>}} */
export const nodeClock = Object.freeze({
  nowMs: () => Date.now(),
  isoNow: () => new Date().toISOString(),
  sleep,
});
