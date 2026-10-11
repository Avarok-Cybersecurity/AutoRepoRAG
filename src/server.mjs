// server.mjs — download, verify, run, and stop a pinned lattice-server release.
//
// Contract: fetches lattice-db-linux-{x64|arm64}.tar.gz plus its checksum
// file from the pinned lattice-db GitHub release (or releases/latest/download
// when version is "latest"), verifies the archive against its checksum line
// (src/checksum.mjs), caches the verified pair per
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
import { LatticeClient } from './lattice.mjs';
import { log, sleep } from './util.mjs';

const RELEASE_BASE = 'https://github.com/Avarok-Cybersecurity/lattice-db/releases';

/** Release asset architecture suffix for this machine. Linux x64/arm64 only. */
export function detectArch() {
  if (process.platform !== 'linux') {
    throw new Error(
      `unsupported platform "${process.platform}": lattice-server release binaries target linux runners`,
    );
  }
  const arch = { x64: 'x64', arm64: 'arm64' }[process.arch];
  if (!arch) throw new Error(`unsupported CPU architecture "${process.arch}" (need x64 or arm64)`);
  return arch;
}

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
 * Provision a lattice-server: returns { pid, port, baseUrl, stop() }.
 * pidFile is written before readiness so the cleanup step can always find it.
 */
export async function provisionServer({ version, port, workDir, pidFile }) {
  const arch = detectArch();
  const asset = `lattice-db-linux-${arch}.tar.gz`;
  const checksums = `lattice-db-linux-${arch}.sha256`;
  const dir = join(workDir, 'lattice', version);
  const dataDir = join(workDir, 'lattice-data');
  mkdirSync(dir, { recursive: true });
  rmSync(dataDir, { recursive: true, force: true });
  mkdirSync(dataDir, { recursive: true });

  // "latest" floats between runs, so only pinned tags are cache-eligible.
  let verified = false;
  if (version !== 'latest' && existsSync(join(dir, asset)) && existsSync(join(dir, checksums))) {
    const cached = verifyChecksum(join(dir, asset), join(dir, checksums), asset);
    if (cached.ok) {
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
  }
  execFileSync('tar', ['-xzf', join(dir, asset), '-C', dir], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  const binary = join(dir, 'lattice-server');
  if (!existsSync(binary)) {
    throw new Error(`archive ${asset} did not contain a lattice-server binary`);
  }

  await assertPortFree(port);

  const logPath = join(dir, 'lattice-server.log');
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
