# Security Policy

## Supported Versions

Only the most recent release line receives security fixes.

| Version | Supported |
| ------- | --------- |
| 0.1.x (moving `v1` once released) | ✅ |
| anything older | ❌ |

## Reporting a Vulnerability

Email **security@avarok.com**. Please include a description of the issue, a
proof of concept if you have one, and the action version (tag or commit SHA)
you tested against. We aim to acknowledge reports within 3 business days.

Please do **not** open a public issue for security reports.

## How this action handles your embedding API key

- The key crosses into the action **only via an environment variable**
  (`INPUT_EMBEDDING_API_KEY`); it is never interpolated into a `run:` body,
  command line, or URL.
- The very first thing the entrypoint does is register the key with
  `::add-mask::`, so it is redacted from all subsequent step logs.
- The key is used solely as an `Authorization: Bearer` header on requests to
  the `embedding-endpoint` you configured. It is **never persisted**: it is not
  written to the corpus, the metadata file, the step summary, action outputs,
  caches, or artifacts.
- Mock mode (`mock-embeddings: true`) needs no key at all — use it for CI on
  forks and pull requests so secrets never reach untrusted contexts.

## Supply-chain posture

- Zero npm dependencies — the action runs vendored, plain Node ESM sources.
- The `lattice-server` binary is downloaded from a **pinned release tag**
  (`lattice-version`, default `v0.3.3`) and verified against its published
  SHA-256 checksum before it is executed; it listens on loopback only.
- Our own CI pins every third-party action by full commit SHA.
