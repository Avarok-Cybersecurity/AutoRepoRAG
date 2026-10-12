// SPDX-License-Identifier: Apache-2.0
// The accessibility bar the browser suite holds the open dialog to: no serious
// or critical axe violation under WCAG 2.2 AA plus best practice.

import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/** Serious and critical axe findings inside the dialog, as "rule: target" lines. */
export async function seriousViolations(page) {
  const { violations } = await new AxeBuilder({ page }).include('.cc').withTags(TAGS).analyze();
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')}`));
}
