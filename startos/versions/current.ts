import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:17',
  releaseNotes: {
    en_US:
      'Adds a network setting, so the wallet can run on testnet4 as well as mainnet. On mainnet nothing changes and the wallet still arrives connected to Shulcrum. On testnet4 no package serves this chain yet, so you supply a server address or the wallet starts without one. Wallets are kept separately per network, so switching does not lose anything.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
