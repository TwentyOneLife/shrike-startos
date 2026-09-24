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

/**
 * Tor's SOCKS proxy, which is how this wallet reaches a server published only as an onion.
 *
 * Not a declared dependency. StartOS dependencies are static, and this one is needed only when the
 * configured server happens to be an onion, which is a runtime fact. Tor is present on any StartOS
 * that serves anything over it, and `getBridgeAddress` carries a fallback for the case where it is
 * not, so a missing Tor fails the connection rather than the startup.
 *
 * The ids come from tor-startos itself (`socksHostId`, `socksPort`), whose binding is deliberately
 * unexported: it still allocates the stable bridge address, which is exactly what is wanted here.
 */
export const torPackageId = 'tor'
export const torSocksHostId = 'socks'
export const torSocksPort = 9050

/**
 * Whether an Electrum server address can only be reached through Tor.
 *
 * Decided from the address rather than asked as a setting, because the answer is a property of the
 * address and a user who has typed an onion has already said everything there is to say. The scheme
 * this package writes is stripped first, and a port suffix is optional because one may or may not
 * be present depending on where the address came from.
 */
export const isOnionAddress = (server: string) =>
  /\.onion(:\d+)?$/i.test(server.replace(/^[a-z0-9+.-]+:\/\//i, ''))

/**
 * The server address as Shrike wants it, which is a scheme followed by host and port.
 *
 * The scheme is not cosmetic: `tcp` is plaintext and `ssl` is TLS, and a wallet that guesses wrong
 * fails at the handshake with nothing useful to say. A packaged Shulcrum on the bridge is plaintext,
 * so `tcp` is the right default, but the same Shulcrum published over Tor answers TLS on a different
 * port. Anyone pasting that onion address would otherwise be handed a broken connection by a wallet
 * that ignored the `ssl://` they had copied along with it.
 *
 * So a scheme the user supplied is kept, and only a bare `host:port` gets the default.
 */
export const withScheme = (server: string) =>
  /^[a-z0-9+.-]+:\/\//i.test(server) ? server : `tcp://${server}`
