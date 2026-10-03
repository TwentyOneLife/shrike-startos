import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:20',
  releaseNotes: {
    en_US:
      "Gives the wallet a camera, so it can read the QR codes of an airgapped signer such as a SeedSigner. Press Scan in the wallet and your browser asks for the camera of the computer you are sitting at; it is released when the scanner closes. This needs an ordinary browser on this service's https address. Tor Browser withholds the camera from every page, so scanning is not possible there.\n\nThe camera was meant to work before and did not: it was switched off on every start of the service after the first, which is why Scan answered 'No cameras available'.\n\nNever show a SeedQR or a seed phrase to this camera. What it sees is sent to the server.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
