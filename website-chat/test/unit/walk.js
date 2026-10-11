// SPDX-License-Identifier: Apache-2.0
// Test helper: every file under a directory of the library, as
// [relativePath, text]. Skips dependencies and generated data.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const SKIP_DIRS = new Set(['node_modules', 'test-results', 'playwright-report', '.site']);

export function filesUnder(dir, keep) {
  const out = [];
  const visit = (abs) => {
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const path = join(abs, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) visit(path);
      } else if (keep(entry.name)) {
        out.push([relative(ROOT, path), readFileSync(path, 'utf8')]);
      }
    }
  };
  visit(join(ROOT, dir));
  return out;
}
