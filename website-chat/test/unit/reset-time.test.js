// SPDX-License-Identifier: Apache-2.0
// The daily-quota reset line (src/core/reset-time.js): a clock time alone
// misleads anyone in another zone or near midnight, so it names its zone and
// how long is left.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COPY_EN } from '../../src/copy-en.js';
import { resetText } from '../../src/core/reset-time.js';

const NOW = Date.UTC(2026, 9, 11, 16, 48, 0);
const IN = (min) => NOW + min * 60_000;
const at = (resetAt) => resetText(resetAt, NOW, COPY_EN, { locale: 'en-US', timeZone: 'UTC' });

describe('resetText', () => {
  it('names the zone and the time left', () => {
    assert.equal(at(IN(192)), 'The free pool refills at 8:00 PM UTC, 3 h 12 min from now.');
  });

  it('rounds the wait up to the minute and keeps a zero hour', () => {
    assert.equal(at(IN(11.2)), 'The free pool refills at 4:59 PM UTC, 0 h 12 min from now.');
  });

  it('a reset already past drops the countdown', () => {
    assert.equal(at(IN(-5)), 'The free pool refills at 4:43 PM UTC.');
  });

  it('follows the given zone', () => {
    const text = resetText(IN(192), NOW, COPY_EN, { locale: 'en-US', timeZone: 'America/New_York' });
    assert.match(text, /at 4:00 PM EDT, 3 h 12 min from now\.$/);
  });
});
