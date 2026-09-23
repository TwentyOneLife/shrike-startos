import { sdk } from './sdk'
import { shulcrumPackageId } from './utils'

export const setDependencies = sdk.setupDependencies(async () => {
  return {
    // Required, not optional: this wallet reads one chain and Shulcrum is what serves it. Running
    // rather than merely installed, because a stopped server is a wallet that cannot see its
    // money. No health check is required: the index takes days to build and the wallet is useful
    // before it finishes, so this package reports the connection itself instead.
    //
    // The range is unflavored on purpose. Shulcrum's version is flavored (`#blake:...`) and a
    // flavored version satisfies an unflavored range only through the `satisfies` list its own
    // package declares, which is where that decision belongs.
    [shulcrumPackageId]: {
      kind: 'running',
      versionRange: '>=2.1.2:0',
      healthChecks: [],
    },
  } as const
})
