import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:4',
  releaseNotes: {
    en_US:
      "The wallet no longer routes its connection to Shulcrum through a proxy. It did when Tor was installed, which was this package's own default, and that could never work: Shulcrum answers on a private address on the same server, and Tor refuses private addresses. Measured on a node, the same address answered directly and failed through the proxy in the same breath. The proxy setting is gone rather than defaulted off, because nothing else this wallet does leaves the machine.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
