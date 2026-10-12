// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// focus-trap.js — Tab, Shift+Tab and their Option/Alt forms inside a modal.
// The trap moves focus itself instead of leaving the step to the browser,
// because browsers disagree on where the step goes from a container: WebKit
// does not focus a clicked button (focus stays on the dialog), and its
// Option+Tab from the dialog walked out of it. Moving focus ourselves gives
// one order in every engine, from any start: a control, the container, a
// non-tabbable region inside it, or a focus that fell to <body>.
// =============================================================================

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** The visible tabbable controls inside `container`, in document order. */
export function tabbables(container) {
  return [...container.querySelectorAll(TABBABLE)].filter((el) => el.offsetParent !== null);
}

/**
 * Handle a Tab keydown for `container`: focus the next (or, with Shift, the
 * previous) tabbable after the current focus in document order, wrapping at
 * either end. Returns whether it handled the key.
 */
export function trapTab(e, container) {
  if (e.key !== 'Tab' || e.ctrlKey || e.metaKey) return false;
  const els = tabbables(container);
  if (els.length === 0) return false;
  const active = document.activeElement;
  // Where the current focus sits relative to each control (`active` may be
  // the container, a region inside it, a control, or <body> outside it).
  const after = (el) => Boolean(active && active !== el && active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  const before = (el) => Boolean(active && active !== el && el.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING && !el.contains(active));
  const inside = active && container.contains(active);
  let target;
  if (e.shiftKey) {
    target = inside ? els.findLast(before) : undefined;
    target ??= els[els.length - 1];
  } else {
    target = inside ? els.find(after) : undefined;
    target ??= els[0];
  }
  e.preventDefault();
  target.focus();
  return true;
}
