// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// serve.mjs — the static server the browser suite runs against:
//   /             the harness page (e2e/harness/index.html)
//   /harness/*    the harness's own files
//   /repo-chat/*  the bundle the ACTION emitted (e2e/.site/repo-chat, written
//                 by scripts/emit-website-chat.mjs: dist + verified wasm +
//                 manifest), so the suite tests what sites actually vendor.
// Usage: node e2e/serve.mjs <port>
// =============================================================================

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const MOUNTS = [
  ['/harness/', join(HERE, 'harness')],
  ['/repo-chat/', join(HERE, '.site', 'repo-chat')],
];
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
};

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1) {
  console.error('usage: node e2e/serve.mjs <port>');
  process.exit(2);
}

/** The file a URL path maps to, or null when it is outside every mount. */
function resolvePath(urlPath) {
  if (urlPath === '/') return join(HERE, 'harness', 'index.html');
  for (const [prefix, dir] of MOUNTS) {
    if (!urlPath.startsWith(prefix)) continue;
    const file = normalize(join(dir, decodeURIComponent(urlPath.slice(prefix.length))));
    return file.startsWith(dir + sep) ? file : null;
  }
  return null;
}

createServer((req, res) => {
  const file = resolvePath(new URL(req.url, 'http://localhost').pathname);
  let size;
  try {
    size = file && statSync(file).isFile() ? statSync(file).size : null;
  } catch {
    size = null;
  }
  if (size === null) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'content-length': String(size), 'cache-control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`repo-chat e2e server on http://127.0.0.1:${port}/`));
