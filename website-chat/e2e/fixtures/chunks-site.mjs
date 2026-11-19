// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chunks-site.mjs — the pages behind the search-mode fixture snapshots, in
// the shape the action's markdown chunk strategy produces over a site's .md
// twins: one chunk per heading section, with the site's sidecar fields
// (url, title, lastmod). Rows: [path, url, title, heading_path, start_line, text].
// One row carries a javascript: url on purpose: payloads are untrusted, and
// the suite checks it is shown without a link.
// =============================================================================

export const SITE_PAGES = [
  ['index.md', 'https://site.test/', 'Example Engine', ['Example Engine'], 1, '# Example Engine\n\nExample Engine is a small inference server for teams that want their models on their own hardware.'],
  ['about/index.md', 'https://site.test/about/', 'About us', ['About'], 1, '# About\n\nWe are a five person team that builds tools for running models locally.'],
  ['about/index.md', 'https://site.test/about/', 'About us', ['About', 'Contact'], 5, '## Contact\n\nWrite to the support team at help@site.test, or open an issue on the tracker. We answer within two working days.'],
  ['about/index.md', 'https://site.test/about/', 'About us', ['About', 'Careers'], 11, '## Careers\n\nWe hire engineers who like profilers and plain text.'],
  ['pricing/index.md', 'https://site.test/pricing/', 'Pricing', ['Pricing', 'Free plan'], 3, '## Free plan\n\nThe free plan covers one server and community support. No card needed.'],
  ['pricing/index.md', 'https://site.test/pricing/', 'Pricing', ['Pricing', 'Pro plan'], 9, '## Pro plan\n\nThe pro plan adds priority support, single sign on and audit logs, billed monthly.'],
  ['docs/install/index.md', 'https://site.test/docs/install/', 'Install', ['Install', 'Requirements'], 3, '## Requirements\n\nYou need Linux or macOS, 16 GB of memory and a recent **GPU driver**.'],
  ['docs/install/index.md', 'https://site.test/docs/install/', 'Install', ['Install', 'Docker'], 12, '## Docker\n\nRun `docker run example/engine` to start the server on port 8080.'],
  ['legal/index.md', 'javascript:alert(document.domain)', 'Legal notice', ['Legal'], 1, '# Legal\n\nThe legal notice lists the company address and registration.'],
];

export const GUIDE_PAGES = [
  ['guides/backups.md', 'https://guide.test/backups/', 'Backups', ['Backups', 'Schedule'], 3, '## Schedule\n\nTake a snapshot of the model store every night and keep seven of them.'],
  ['guides/backups.md', 'https://guide.test/backups/', 'Backups', ['Backups', 'Restore'], 10, '## Restore\n\nTo restore, stop the server, copy the snapshot back and start it again.'],
  ['guides/scaling.md', 'https://guide.test/scaling/', 'Scaling', ['Scaling', 'Batching'], 2, '## Batching\n\nLarger decode batches raise throughput until memory runs out.'],
  ['guides/support.md', 'https://guide.test/support/', 'Getting support', ['Getting support'], 1, '# Getting support\n\nPaid plans include priority support from the engineers who wrote the server.'],
];
