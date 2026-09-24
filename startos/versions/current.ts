import { VersionInfo } from '@start9labs/start-sdk'

/** The Shrike release this package installs, as its own tag names it. */
export const SHRIKE_VERSION = 'v2.5.5-blake2b.26'
/** The same release as its Debian package names it, which is what the image installs. */
export const SHRIKE_DEBVERSION = '2.5.5-26'

export const current = VersionInfo.of({
  // Flavored, as Shulcrum's package is: this is a wallet for one chain, and the flavor is what
  // stops it satisfying anything that wanted Sparrow on Bitcoin. The number tracks Shrike's
  // upstream version; the revision after it is this package's own.
  version: '#blake:2.5.5:13',
  releaseNotes: {
    en_US:
      "Labelled unofficial, which it always was. This package is built by TwentyOne.Life and not by the people who write the wallet, and problems with it should be reported to the package rather than to them. The Shrike name and bird are used with the authors' permission, on the condition that the package says both of these things plainly.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
