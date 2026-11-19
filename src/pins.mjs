// pins.mjs — which release asset fits this runner, and the sha256 values
// this action pins for known lattice-db releases.
//
// Contract: pure. Every downloaded asset is first verified against its
// release's own checksum file (src/checksum.mjs). For a version listed in
// PINNED_SHA256 it must ALSO equal the value pinned here, so a release asset
// replaced after this action shipped is refused even when the replacement
// came with a matching checksum file. Versions not listed (older v2 pins
// such as v0.3.3) rely on the release checksum file alone, as before.
//
// v0.5.0 values: the release's published .sha256 files (2026-11-19), each
// re-computed with `shasum -a 256` over the assets downloaded by
// `gh release download v0.5.0 -R Avarok-Cybersecurity/lattice-db`; both agreed.
// To pin a new release, add its entry the same way.

export const PINNED_SHA256 = Object.freeze({
  'v0.5.0': Object.freeze({
    'lattice-db-linux-x64.tar.gz': '25e83007500b87595ff299ad11393b9f7bbd15bb2a36eaeada48c0d3b2438571',
    'lattice-db-linux-arm64.tar.gz': '7c45c48ace38e6b913b0a8b5f9041cc2dc70a449029f31b8da4e74c28d209087',
    'lattice-db-macos-arm64.tar.gz': 'f8ede99050c8f45a93a383be83c98a667233a5b310ebd994f26e9fdedbec8de2',
    'lattice-db-macos-x64.tar.gz': '451bcda5205d764cc946e91f07af82ad18db8566938ab7ae62e0f8871c39e55d',
    'lattice_server.js': 'a0fcea2d1ca1c0122845565c100af4e4a59569b892486496610e634d148265f3',
    'lattice_server_bg.wasm': 'ef37c0fa31ae7bfb65ce26f5a0323763ab839848683bd667ebfb83647cb356ee',
  }),
});

const OS = { linux: 'linux', darwin: 'macos' };
const ARCH = { x64: 'x64', arm64: 'arm64' };

/**
 * The server archive and its checksum file for a Node platform/arch.
 * @returns {{archive: string, checksums: string}}
 */
export function serverAsset(platform, arch) {
  const os = OS[platform];
  if (!os) throw new Error(`unsupported platform "${platform}": lattice-server release binaries target linux and macOS runners`);
  const cpu = ARCH[arch];
  if (!cpu) throw new Error(`unsupported CPU architecture "${arch}" (need x64 or arm64)`);
  const base = `lattice-db-${os}-${cpu}`;
  return { archive: `${base}.tar.gz`, checksums: `${base}.sha256` };
}

/** Refuse `sha256` for `asset` of `version` when this action pins another value. */
export function assertPinned(version, asset, sha256) {
  const pins = PINNED_SHA256[version];
  if (!pins) return;
  const want = pins[asset];
  if (!want) throw new Error(`this action pins ${version} but pins no sha256 for ${asset}`);
  if (sha256 !== want) {
    throw new Error(`${asset} (${version}) has sha256 ${sha256}, but this action pins ${want}; refusing it`);
  }
}
