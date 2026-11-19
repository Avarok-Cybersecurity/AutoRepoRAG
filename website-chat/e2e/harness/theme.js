// SPDX-License-Identifier: Apache-2.0
// The consumer site's config.theme, shared by both harness pages: its own
// palette (harness.css) passed as var() references.

const v = (name) => `var(--h-${name})`;

export const THEME = {
  bg: v('bg'),
  bg2: v('bg2'),
  card: v('card'),
  border: v('border'),
  borderStrong: v('border-strong'),
  text: v('t1'),
  text2: v('t2'),
  text3: v('t3'),
  accent: v('accent'),
  accentSoft: v('accent-soft'),
  onAccent: v('on-accent'),
  green: v('green'),
  amber: v('amber'),
  fontMono: 'ui-monospace, Menlo, Consolas, monospace',
  fontSans: 'system-ui, sans-serif',
  shadowLg: v('shadow-lg'),
};
