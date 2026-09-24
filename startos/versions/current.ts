import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:18',
  releaseNotes: {
    en_US:
      "Fixes the testnet4 server address, which was written into the configuration file mainnet reads rather than testnet4's own. A wallet set to testnet4 started on the wallet's built-in defaults instead and reported a connection error. If you ran 2.5.5:17 on testnet4, that address was also left in your mainnet configuration; mainnet takes its server from Shulcrum at every start, so it corrects itself the next time you run mainnet with Shulcrum running. If Shulcrum is not running, set the server in the wallet yourself.\n\nAlso closes an outbound connection on any network other than mainnet. This package turns off the public block explorer, the exchange rate source and the update check, but those settings only ever reached mainnet's configuration: on testnet4 the wallet used its own stock values and fetched fee rates from a public mempool site over the clearnet. They are now applied on whichever network is running, the same way the server address is: if you change one inside the wallet, the next restart of this service sets it back.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
