// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// reset-time.js — the daily-quota reset line. Pure: the reset stamp, the
// current time and the formatting locale/zone are all passed in.
//
// A bare clock time misleads a visitor in another zone, or one reading near
// midnight about a reset tomorrow, so the line names its zone and how long is
// left: "The free pool refills at 8:00 PM UTC, 3 h 12 min from now."
// =============================================================================

import { fill } from './template.js';

/**
 * @param {number} resetAt  epoch ms of the reset
 * @param {number} now      epoch ms now
 * @param {object} copy     config.copy
 * @param {{ locale: string[] | string, timeZone: string | undefined }} where
 *   `locale` [] and `timeZone` undefined mean the visitor's own (the browser's).
 */
export function resetText(resetAt, now, copy, { locale, timeZone }) {
  const time = new Date(resetAt).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone });
  const minutes = Math.ceil((resetAt - now) / 60_000);
  if (minutes <= 0) return `${copy.errors.quota.reset} ${time}.`;
  const wait = fill(copy.errors.quota.resetIn, { h: Math.floor(minutes / 60), m: minutes % 60 });
  return `${copy.errors.quota.reset} ${time}, ${wait}.`;
}
