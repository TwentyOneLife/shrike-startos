import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:1',
  releaseNotes: {
    en_US:
      'The wallet no longer encodes its screen while nothing is happening, which cost most of a CPU core on an idle server. The Electrum check now waits for Shulcrum rather than reporting a failure while it is stopped or still building its index.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
