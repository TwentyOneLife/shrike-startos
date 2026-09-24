import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Only the fields this package sets. Shrike's config carries many more and the user may change
// them in the wallet, so this is merged into the file rather than written over it.
const shape = z.object({
  // A plain string, not the literal this package writes. `merge` validates the merged object, so a
  // literal here rejects the value already in the file: on a network with no server configured
  // nothing overrides `BITCOIN_CORE`, validation fails, and startup dies. Same shape of mistake as
  // the required `proxyServer` below, found by the test that covers the no-server case. The shape
  // has to describe what the file may hold, not only what we write into it.
  serverType: z.string().optional(),
  electrumServer: z.string().optional(),
  useProxy: z.boolean(),
  // The settings that decide whether this wallet talks to anyone but its own server. They are in
  // the defaults file, which only ever reached mainnet: a config the wallet created for another
  // network carries Sparrow's stock values instead, and those reach out. The testnet4 config on the
  // test node had `blockExplorer: https://mempool.guide`, `feeRatesSource: MEMPOOL_GUIDE` and
  // `checkNewVersions: true`, so a wallet nobody had touched was fetching fee rates and update
  // checks over the clearnet. Seeding cannot fix that, because the wallet writes the file first.
  // Asserted at every start instead, on whichever network is running.
  //
  // Declared here so the merge payload typechecks. The SDK writes an undeclared field through
  // anyway, measured, so this is a type-level requirement rather than a runtime one.
  blockExplorer: z.string().optional(),
  feeRatesSource: z.string().optional(),
  exchangeSource: z.string().optional(),
  checkNewVersions: z.boolean().optional(),
  // Optional, and it has to be. Shrike serialises its config with Gson, which omits null fields, so
  // a config the wallet wrote itself may not carry this key at all: the one on the test node had 41
  // fields and no `proxyServer`. This package never sets it, but a required field here makes
  // `merge` validate the merged object, throw, and take the whole startup with it. Measured against
  // that file: required threw, optional merged and kept all 41 fields.
  proxyServer: z.string().optional(),
})

export type ShrikeConfigType = z.infer<typeof shape>

/**
 * The config for one network.
 *
 * Shrike keeps a separate configuration per network: mainnet's lives at `.shrike/config` and every
 * other network has its own under a directory named for it. Writing only the first one means a
 * wallet switched to testnet4 silently falls back to Shrike's own defaults, which are a Bitcoin
 * Knots RPC on the network's default port. It then reports a configuration error about a data
 * folder nobody set, which looks nothing like the packaging bug it is.
 *
 * Found on 2026-09-24 by pointing the packaged wallet at a testnet4 server and watching it try to
 * reach a node instead. Nothing on this side looked wrong: the setting was stored, the file was
 * written, and it was the wrong file.
 */
export const shrikeConfig = (network: 'mainnet' | 'testnet4') =>
  FileHelper.json(
    {
      base: sdk.volumes.userdir,
      // Shrike keeps its own directory, separate from Sparrow's, so the two can be installed side
      // by side on a desktop. HOME is /config in this image.
      subpath:
        network === 'mainnet' ? '.shrike/config' : `.shrike/${network}/config`,
    },
    shape,
  )
