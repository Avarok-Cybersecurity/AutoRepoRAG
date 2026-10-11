// SPDX-License-Identifier: Apache-2.0
// The theme contract, enforced: no colour literal anywhere in the library's
// styles (source CSS, Svelte markup/styles, and the built stylesheet), and
// every --arr-* property the styles read is one config.theme sets or one
// tokens.css derives from them.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { THEME_KEYS, themeVarName } from '../../src/core/theme.js';
import { filesUnder, ROOT } from './walk.js';

const LITERALS = [
  ['hex colour', /#[0-9a-fA-F]{3,8}\b/],
  ['rgb()', /\brgba?\s*\(/i],
  ['hsl()', /\bhsla?\s*\(/i],
  ['hwb/lab/lch/oklab/oklch()', /\b(?:hwb|lab|lch|oklab|oklch)\s*\(/i],
];

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
// Svelte block tags ({#if}, {:else}, {/each}, {@html}) are not colours.
const stripSvelteTags = (text) => text.replace(/\{[#:/@][a-z]+/g, '{');

export function colourLiterals(text) {
  return LITERALS.filter(([, re]) => re.test(text)).map(([name]) => name);
}

const STYLE_SOURCES = [
  ...filesUnder('src', (n) => n.endsWith('.css')).map(([p, t]) => [p, stripComments(t)]),
  ...filesUnder('src', (n) => n.endsWith('.svelte')).map(([p, t]) => [p, stripSvelteTags(stripComments(t.replace(/<script>[\s\S]*?<\/script>/, '')))]),
  ['dist/repo-chat.css', readFileSync(join(ROOT, 'dist', 'repo-chat.css'), 'utf8')],
];

describe('no colour literals in the library', () => {
  it('scans a real set of files', () => {
    assert.ok(STYLE_SOURCES.length >= 10, `only ${STYLE_SOURCES.length} style sources found`);
  });

  for (const [path, text] of STYLE_SOURCES) {
    it(`${path} uses only --arr-* colours`, () => {
      const lines = text.split('\n').filter((l) => colourLiterals(l).length > 0);
      assert.deepEqual(lines, []);
    });
  }

  it('the detector itself catches each literal form (negative control)', () => {
    for (const sample of ['color: #c65a2e;', 'color: #fff;', 'background: rgba(0, 0, 0, 0.45);', 'color: hsl(20 60% 50%);', 'color: oklch(0.6 0.1 40);']) {
      assert.notDeepEqual(colourLiterals(sample), [], sample);
    }
    for (const fine of ['color: var(--arr-accent);', 'href="#L12"', 'border: 1px solid color-mix(in srgb, var(--arr-amber) 40%, transparent);']) {
      assert.deepEqual(colourLiterals(fine), [], fine);
    }
  });
});

describe('every --arr-* property read is defined', () => {
  const tokens = readFileSync(join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8');
  const derived = new Set([...tokens.matchAll(/(--arr-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const themed = new Set(THEME_KEYS.map(themeVarName));

  it('derived tokens never shadow a theme property', () => {
    assert.deepEqual([...derived].filter((v) => themed.has(v)), []);
  });

  for (const [path, text] of STYLE_SOURCES.filter(([p]) => p.startsWith('src'))) {
    it(`${path}`, () => {
      const read = [...text.matchAll(/var\((--arr-[a-z0-9-]+)\)/g)].map((m) => m[1]);
      assert.deepEqual(read.filter((v) => !themed.has(v) && !derived.has(v)), []);
    });
  }

  it('themeVarName maps camelCase keys to kebab-case properties', () => {
    assert.equal(themeVarName('borderStrong'), '--arr-border-strong');
    assert.equal(themeVarName('text2'), '--arr-text2');
  });
});
