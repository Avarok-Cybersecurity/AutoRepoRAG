// file-size.test.mjs — the action's own code files stay at or under 500
// lines (the library under website-chat/ checks its own tree).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CODE = /\.(?:mjs|js|sh|yml)$/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (CODE.test(e.name)) out.push(p);
  }
  return out;
}

const FILES = ['src', 'test', 'scripts', '.github', 'examples'].flatMap((d) => walk(join(ROOT, d))).concat([join(ROOT, 'action.yml')]);

describe('code files stay at or under 500 lines', () => {
  it('scans a real set of files', () => assert.ok(FILES.length >= 20, `${FILES.length} files`));
  for (const f of FILES) {
    it(relative(ROOT, f), () => {
      const text = readFileSync(f, 'utf8');
      const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
      assert.ok(lines <= 500, `${lines} lines`);
    });
  }
});
