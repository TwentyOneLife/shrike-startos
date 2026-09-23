import { FileHelper, T, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  title: z.string(),
  username: z.string(),
  password: z.string().optional(),
  enableWayland: z.boolean().catch(true),
  forceSoftwareRendering: z.boolean().catch(false),
  // No server choice: this wallet reads one chain, and Shulcrum is the only server that serves it.
  shrike: z.object({
    proxy: z.object({
      type: z.union([z.literal('tor'), z.literal('none')]).catch('tor'),
    }),
  }),
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
  // Tor only if it is there. Seeding `tor` unconditionally made an optional dependency a required
  // one the moment the package was installed: the manifest says optional, the store said tor, and
  // dependencies.ts then demanded a running tor the user never asked for. The dynamic default in
  // the settings form could not correct it either, because the form is prefilled from the store.
  const proxy = (await effects.getInstalledPackages()).includes('tor')
    ? ('tor' as const)
    : ('none' as const)
  await store.write(effects, {
    title: 'Shrike',
    username: 'shrike',
    enableWayland: true,
    forceSoftwareRendering: false,
    shrike: {
      proxy: {
        type: proxy,
      },
    },
  })
}
