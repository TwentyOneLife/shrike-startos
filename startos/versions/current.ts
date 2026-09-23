import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:2',
  releaseNotes: {
    en_US:
      'The wallet now renders in Tor Browser, which it did not before: that browser withholds the WebCodecs API to resist fingerprinting, and the previous streaming client refused to start without it. The base image moves to Selkies 2, which sends JPEG frames instead of failing. The application catalogue inherited from that base image, which could install arbitrary software into the container holding your wallet files, has been removed. Audio is switched off; a wallet has nothing to say.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
