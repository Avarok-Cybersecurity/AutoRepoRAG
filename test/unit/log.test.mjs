// log.test.mjs — the logging facade formats lines and hands them to the
// installed sink, and refuses to log before one is installed. Each case runs
// in a fresh module instance (a query-string import) so sinks do not leak.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

let n = 0;
const freshLog = () => import(`../../src/log.mjs?case=${n++}`);

describe('log facade', () => {
  it('throws, naming the fix, when no sink is installed', async () => {
    const { log } = await freshLog();
    assert.throws(() => log('x'), { message: /no log sink installed: the entrypoint must call installLogSink first/ });
  });

  it('hands log and ::warning:: lines to the installed sink', async () => {
    const { installLogSink, log, warning } = await freshLog();
    const lines = [];
    installLogSink((t) => lines.push(t));
    log('[done] a');
    warning('careful');
    assert.deepEqual(lines, ['[done] a\n', '::warning::careful\n']);
  });

  it('refuses a sink that is not a function', async () => {
    const { installLogSink } = await freshLog();
    assert.throws(() => installLogSink(null), { message: /needs a function/ });
  });
});
