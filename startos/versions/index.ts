import { VersionGraph } from '@start9labs/start-sdk'
import { current, SHRIKE_DEBVERSION, SHRIKE_VERSION } from './current'

// No earlier versions: this package starts here. The ones it was forked from installed a different
// wallet on a different chain, so there is nothing to migrate from.
export const versionGraph = VersionGraph.of({
  current,
  other: [],
})

export { SHRIKE_VERSION, SHRIKE_DEBVERSION }
