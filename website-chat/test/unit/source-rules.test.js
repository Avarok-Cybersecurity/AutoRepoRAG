// SPDX-License-Identifier: Apache-2.0
// House rules for the library's source: it is framework-free outside Svelte
// itself (no SvelteKit `$app/*` or site `$lib/*` imports, so it builds and
// runs on any site), and no file exceeds 500 lines.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { filesUnder } from './walk.js';

const CODE = /\.(?:js|mjs|svelte|css|html)$/;
const SOURCE = filesUnder('src', (n) => CODE.test(n));
const OWN = ['src', 'test', 'e2e'].flatMap((d) => filesUnder(d, (n) => CODE.test(n)));

const KIT_IMPORT = /(?:from\s*|import\s*\(\s*|import\s+)['"](\$app|\$lib)\//;

describe('no SvelteKit or site imports', () => {
  it('scans the source tree', () => {
    assert.ok(SOURCE.length >= 20, `only ${SOURCE.length} source files found`);
  });

  for (const [path, text] of SOURCE) {
    it(`${path}`, () => {
      assert.equal(KIT_IMPORT.exec(text)?.[0] ?? null, null);
    });
  }

  it('the detector catches each import form (negative control)', () => {
    for (const s of ["import { browser } from '$app/environment';", 'import x from "$lib/data.js";', "await import('$lib/x.js')"]) {
      assert.ok(KIT_IMPORT.test(s), s);
    }
    assert.equal(KIT_IMPORT.test("import { mount } from 'svelte';"), false);
  });
});

describe('files stay at or under 500 lines', () => {
  for (const [path, text] of OWN) {
    it(`${path}`, () => {
      const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
      assert.ok(lines <= 500, `${path} has ${lines} lines`);
    });
  }
});
