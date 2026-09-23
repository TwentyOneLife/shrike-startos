import { sdk } from './sdk'
import { uiTlsPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, 'main')
  // The image serves this interface both in the clear and over TLS. Binding the plaintext port
  // asks the OS for an http origin, and it publishes an https address beside it rather than
  // instead of it: the plaintext one keeps working and carries the interface password readable to
  // anyone on the same network. Nobody arrives there by accident, since Open UI offers the
  // encrypted address, but it is reachable by anyone who types it.
  //
  // Binding the TLS port instead declares the origin secure, so there is no plaintext address to
  // find. The certificate the image generates is self-signed, which is why validation of the leg
  // between the OS proxy and this container is disabled: that leg never leaves the host, and the
  // certificate a browser sees is the OS's own, not this one.
  const uiMultiOrigin = await uiMulti.bindPort(uiTlsPort, {
    protocol: 'https',
    addSsl: { upstreamCertValidation: 'disable' },
  })

  const ui = sdk.createInterface(effects, {
    name: 'Web UI',
    id: 'ui',
    description: 'Web Interface',
    type: 'ui',
    schemeOverride: null,
    masked: false,
    username: null,
    path: '',
    query: {},
  })

  const uiReceipt = await uiMultiOrigin.export([ui])

  return [uiReceipt]
})
