import { FileHelper, T, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  title: z.string(),
  username: z.string(),
  password: z.string().optional(),
  enableWayland: z.boolean().catch(true),
  forceSoftwareRendering: z.boolean().catch(false),
  // The chain this wallet runs on. Shrike is one network per process, so this is decided before
  // it starts rather than inside it, and changing it restarts the service.
  network: z
    .union([z.literal('mainnet'), z.literal('testnet4')])
    .catch('mainnet'),
  // Only consulted on testnet4. On mainnet the server is Shulcrum on this box and there is nothing
  // to choose; on testnet4 no package serves this chain yet, so an address has to come from
  // somewhere and the only honest place is the person running it.
  testnet4Server: z.string().catch(''),
  // No proxy choice; see main.ts for why one could only break the connection.
})

export type StoreType = z.infer<typeof shape>

export const store = FileHelper.yaml(
  {
    base: sdk.volumes.main,
    subpath: 'start9/config.yaml',
  },
  shape,
)

export const createDefaultStore = async (effects: T.Effects) => {
  // check if the file exists (from previous installs or upgrades)
  const conf = await store.read().once()
  if (conf) {
    // already exists — nothing to migrate (stale user/password keys will be preserved but ignored)
    console.log('settings already exist, skipping default creation')
    return
  }

  // config file does not exist, create it
  console.log('no settings yet, writing the defaults')
  await store.write(effects, {
    title: 'Shrike',
    username: 'shrike',
    enableWayland: true,
    forceSoftwareRendering: false,
    network: 'mainnet',
    testnet4Server: '',
  })
}
