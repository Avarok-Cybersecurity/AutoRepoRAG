// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chunks-docs.mjs — the "docs" fixture corpus: a handbook from a second
// repository, so the multi-corpus suite can prove an answer cites both.
// Same embedder and dim as the code corpus (make-corpora.mjs).
// =============================================================================

export const DOCS_CHUNKS = [
  [
    'docs/scheduling.md',
    'markdown',
    1,
    `# Decode batch scheduling

The scheduler decides which requests join the decode batch on every step.
A request joins the decode batch only after its prefill completes and its
KV blocks are reserved, so decode never waits on a half-built cache.`,
  ],
  [
    'docs/scheduling.md',
    'markdown',
    9,
    `## Preemption

When the KV pool runs dry the scheduler preempts the youngest request
first. Long-running generations keep their cache and finish sooner.`,
  ],
  [
    'docs/operations.md',
    'markdown',
    1,
    `# Operating the server

Start the server with a config file. Health checks answer on /healthz and
metrics on /metrics; both are cheap enough to poll every second.`,
  ],
  [
    'docs/operations.md',
    'markdown',
    14,
    `## Upgrades

Drain traffic, stop the old process, start the new one. Cached graphs are
rebuilt at boot, which costs a few seconds of warm-up.`,
  ],
  [
    'docs/glossary.md',
    'markdown',
    1,
    `# Glossary

TTFT is time to first token. TPOT is time per output token. A draft token
is a speculative guess the verifier may accept or reject.`,
  ],
  [
    'docs/faq.md',
    'markdown',
    3,
    `## Why is my first request slow?

The first request pays for graph capture and KV page touches. Every later
request replays captured graphs.`,
  ],
];
