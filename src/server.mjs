// server.mjs — download, verify, run, and stop a pinned lattice-server release.
//
// Contract: fetches lattice-db-{linux|macos}-{x64|arm64}.tar.gz plus its
// checksum file from the pinned lattice-db GitHub release (or
// releases/latest/download when version is "latest"), verifies the archive
// against its checksum line (src/checksum.mjs) and, for versions this action
// pins, against src/pins.mjs too, caches the verified pair per
// version tag and skips the download while the cache still verifies, extracts
// the single `lattice-server` binary, asserts the loopback port is free,
// spawns the server on 127.0.0.1:port with a throwaway LATTICE_DATA_DIR,
// writes a pidfile for the action's always() cleanup step, polls readiness
// (10s cap), asserts the child itself is still alive after readiness (a
// foreign server already bound to the port would otherwise answer for a dead
// child), and stops it with SIGTERM then SIGKILL.

import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, openSync, closeSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { connect } from 'node:net';
import { join } from 'node:path';
import { verifyChecksum } from './checksum.mjs';
import { assertPinned, serverAsset } from './pins.mjs';
import { LatticeClient } from './lattice.mjs';
import { log, sleep } from './util.mjs';

const RELEASE_BASE = 'https://github.com/Avarok-Cybersecurity/lattice-db/releases';

/** Download URL for a release asset; "latest" uses the floating-latest form. */
export function releaseUrl(version, file) {
  return version === 'latest'
    ? `${RELEASE_BASE}/latest/download/${file}`
    : `${RELEASE_BASE}/download/${version}/${file}`;
}

/** Fetch `url` (following redirects) into `dest`; any non-2xx fails. */
export async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

/**
 * Assert nothing is listening on 127.0.0.1:port. A foreign listener would
 * answer our readiness probe even if our own child dies at startup.
 */
function assertPortFree(port) {
  return new Promise((resolvePromise, reject) => {
    const sock = connect({ host: '127.0.0.1', port });
    sock.once('connect', () => {
      sock.destroy();
      reject(new Error(`port ${port} is already in use on 127.0.0.1; pick another lattice-port`));
    });
    sock.once('error', (e) => {
      sock.destroy();
      if (e.code === 'ECONNREFUSED') resolvePromise();
      else reject(new Error(`lattice-port ${port} pre-check failed: ${e.code ?? e.message}`));
    });
    // Loopback connects resolve immediately; a hang means no listener answered.
    sock.setTimeout(2000, () => {
      sock.destroy();
      resolvePromise();
    });
  });
}

/**
 * Provision a lattice-server: download + verify the pinned release binary,
 * then start it. Returns { pid, port, baseUrl, stop() }.
 */
export async function provisionServer({ version, port, workDir, pidFile }) {
  const binary = await fetchServerBinary({ version, workDir });
  return startServer({ binary, port, workDir, pidFile });
}

/** Download (or reuse the verified cache of) the release archive; returns the extracted binary path. */
export async function fetchServerBinary({ version, workDir }) {
  const { archive: asset, checksums } = serverAsset(process.platform, process.arch);
  const dir = join(workDir, 'lattice', version);
  mkdirSync(dir, { recursive: true });

  // "latest" floats between runs, so only pinned tags are cache-eligible.
  let verified = false;
  if (version !== 'latest' && existsSync(join(dir, asset)) && existsSync(join(dir, checksums))) {
    const cached = verifyChecksum(join(dir, asset), join(dir, checksums), asset);
    if (cached.ok) {
      assertPinned(version, asset, cached.sha256);
      log(`[server] using cached ${asset} (${version}, sha256 re-verified)`);
      verified = true;
    } else {
      log(`[server] cached ${asset} failed verification (${cached.detail}); re-downloading`);
    }
  }
  if (!verified) {
    log(`[server] downloading ${asset} (${version})`);
    await download(releaseUrl(version, asset), join(dir, asset));
    await download(releaseUrl(version, checksums), join(dir, checksums));
    const fresh = verifyChecksum(join(dir, asset), join(dir, checksums), asset);
    if (!fresh.ok) {
      throw new Error(`sha256 verification failed for ${asset} (${version}): ${fresh.detail}`);
    }
    assertPinned(version, asset, fresh.sha256);
  }
  execFileSync('tar', ['-xzf', join(dir, asset), '-C', dir], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  const binary = join(dir, 'lattice-server');
  if (!existsSync(binary)) {
    throw new Error(`archive ${asset} did not contain a lattice-server binary`);
  }
  return binary;
}

/**
 * Start `binary` on 127.0.0.1:port with a throwaway data dir. pidFile is
 * written before readiness so the cleanup step can always find it.
 */
export async function startServer({ binary, port, workDir, pidFile }) {
  const dataDir = join(workDir, 'lattice-data');
  rmSync(dataDir, { recursive: true, force: true });
  mkdirSync(dataDir, { recursive: true });

  await assertPortFree(port);

  const logPath = join(workDir, 'lattice-server.log');
  const logFd = openSync(logPath, 'a');
  const child = spawn(binary, [`127.0.0.1:${port}`], {
    env: { ...process.env, LATTICE_DATA_DIR: dataDir },
    stdio: ['ignore', logFd, logFd],
  });
  let spawnError = null;
  let exited = null;
  child.on('error', (e) => {
    spawnError = e;
  });
  child.on('exit', (code, signal) => {
    exited = { code, signal };
  });
  closeSync(logFd);
  child.unref();
  writeFileSync(pidFile, `${child.pid}\n`);
  log(`[server] lattice-server pid ${child.pid} on 127.0.0.1:${port} (pidfile ${pidFile})`);

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await new LatticeClient(baseUrl).waitReady(10_000);
    if (spawnError) throw new Error(`lattice-server failed to spawn: ${spawnError.message}`);
    if (exited || child.exitCode !== null) {
      throw new Error(
        `lattice-server pid ${child.pid} exited (code ${exited?.code ?? child.exitCode}, ` +
          `signal ${exited?.signal ?? 'none'}) yet port ${port} answered the readiness probe — ` +
          'a foreign server is bound to that port',
      );
    }
  } catch (e) {
    const tail = existsSync(logPath) ? readFileSync(logPath, 'utf8').split('\n').slice(-20).join('\n') : '';
    await stopPid(child.pid);
    throw new Error(`${e.message}\n--- lattice-server.log tail ---\n${tail}`);
  }
  log('[server] ready');

  return {
    pid: child.pid,
    port,
    baseUrl,
    stop: async () => {
      await stopPid(child.pid);
      rmSync(pidFile, { force: true });
    },
  };
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** SIGTERM, wait up to 3s, then SIGKILL. Idempotent. */
export async function stopPid(pid) {
  if (!alive(pid)) return;
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return; // exited between the check and the signal
  }
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if (!alive(pid)) return;
    await sleep(100);
  }
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // already gone
  }
}
