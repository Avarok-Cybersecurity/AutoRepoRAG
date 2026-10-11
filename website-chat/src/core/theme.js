// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// theme.js — the theme contract. Every colour and font the stylesheet uses is
// a `--arr-*` custom property: the keys below are set from config.theme on the
// library's root element, and the stylesheet derives the rest from them with
// color-mix (src/styles/tokens.css). No colour literal lives in library CSS.
// =============================================================================

export const THEME_KEYS = Object.freeze([
  'bg',
  'bg2',
  'card',
  'border',
  'borderStrong',
  'text',
  'text2',
  'text3',
  'accent',
  'accentSoft',
  'onAccent',
  'green',
  'amber',
  'fontMono',
  'fontSans',
  'shadowLg',
]);

/** `borderStrong` -> `--arr-border-strong`. */
export function themeVarName(key) {
  return `--arr-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/** [[cssVarName, value], ...] for a validated theme, in THEME_KEYS order. */
export function themeDeclarations(theme) {
  return THEME_KEYS.map((key) => [themeVarName(key), theme[key]]);
}
