import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Only the fields this package sets. Shrike's config carries many more and the user may change
// them in the wallet, so this is merged into the file rather than written over it.
const shape = z.object({
  serverType: z.literal('ELECTRUM_SERVER'),
  electrumServer: z.string().optional(),
  useProxy: z.boolean(),
  proxyServer: z.string(),
})

export type ShrikeConfigType = z.infer<typeof shape>

export const shrike = FileHelper.json(
  {
    base: sdk.volumes.userdir,
    // Shrike keeps its own directory, separate from Sparrow's, so the two can be installed side
    // by side on a desktop. HOME is /config in this image.
    subpath: '.shrike/config',
  },
  shape,
)
