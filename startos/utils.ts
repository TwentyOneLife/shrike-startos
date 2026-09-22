export const uiPort = 3000

/**
 * Shulcrum, the Electrum server for this chain. Named here rather than imported from its package,
 * so this package does not carry a source dependency on it for three constants.
 *
 * The id is `fulcrum` and not `shulcrum`: Shulcrum is packaged as a flavor of Fulcrum, because
 * that is the id anything looking for an Electrum server on StartOS expects. Its interface binds
 * plaintext Electrum on the bridge, which is what a package on the same box connects to.
 */
export const shulcrumPackageId = 'fulcrum'
export const shulcrumHostId = 'main'
export const shulcrumPort = 50001
