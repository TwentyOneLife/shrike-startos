import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:3',
  releaseNotes: {
    en_US:
      'The stream is tuned for Tor. Left at its defaults it sent 2800x1200 at 60 frames per second, far more than an onion circuit carries, so the picture ran seconds behind and typing lagged badly. It now sends a plainer picture at up to 15 frames per second, roughly twelve times fewer pixels per second. Raise either in the side menu if you reach the wallet over a local network. Audio and microphone are now locked off rather than merely switched off, because an unlocked setting is one the page can turn back on.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
