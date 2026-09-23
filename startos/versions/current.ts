import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:10',
  releaseNotes: {
    en_US:
      'Removes things this package had no use for. Tools the base image left in the container that a wallet never needs: ssh, scp, netcat and gpg. None was reachable without code execution inside the session, so this is hardening rather than a fix, but a container holding wallet files is worth less to an attacker without them. Also a dependency that was declared and never imported, which carried security advisories with it. Neither changes how the wallet behaves.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
