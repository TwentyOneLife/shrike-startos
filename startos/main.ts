import { socksHostId, socksPort } from 'tor-startos/startos/utils'
import { sdk } from './sdk'
import {
  shulcrumHostId,
  shulcrumPackageId,
  shulcrumPort,
  uiPort,
} from './utils'
import { store } from './fileModels/store.yaml'
import { shrike } from './fileModels/shrike.json'
import { i18n } from './i18n'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info('Starting Shrike')

  // Watching the settings restarts the service when they change, which is what applies them:
  // Shrike reads its config file once, at startup.
  const conf = await store.read().const(effects)

  if (!conf?.password) {
    throw new Error(i18n('Password is required'))
  }

  // Where Shulcrum answers on the bridge. Null while it is not installed, which the dependency
  // makes a visible state rather than a broken wallet.
  const shulcrumAddress = await sdk.host
    .getBridgeAddress(effects, {
      packageId: shulcrumPackageId,
      hostId: shulcrumHostId,
      internalPort: shulcrumPort,
    })
    .const()

  const proxyAddress =
    conf.shrike.proxy.type === 'tor'
      ? await sdk.host
          .getBridgeAddress(effects, {
            packageId: 'tor',
            hostId: socksHostId,
            internalPort: socksPort,
            fallbackPort: socksPort,
          })
          .const()
      : null

  const subcontainer = await sdk.SubContainer.eager(
    effects,
    { imageId: 'main' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/root/data',
        readonly: false,
      })
      .mountVolume({
        volumeId: 'userdir',
        subpath: null,
        mountpoint: '/config',
        readonly: false,
      }),
    'main',
  )

  if (!conf.forceSoftwareRendering) {
    // StartOS binds DRI devices into the container as root:root, so the unprivileged desktop user
    // cannot open them without this.
    await subcontainer.exec([
      'sh',
      '-c',
      'ls /dev/dri/* 2>/dev/null | xargs -r chmod o+rw',
    ])
  }

  // The wallet arrives connected. A user who has to type a server address into a wallet that is
  // already running beside one has been handed the packaging problem to solve themselves.
  if (shulcrumAddress) {
    await subcontainer.exec([
      'sh',
      '-c',
      'test -f /config/.shrike/config || { mkdir -p /config/.shrike && cp /defaults/.shrike/config /config/.shrike/config; }; chown -R 1000:1000 /config/.shrike',
    ])
    await shrike.merge(effects, {
      serverType: 'ELECTRUM_SERVER',
      electrumServer: `tcp://${shulcrumAddress}`,
      ...(proxyAddress
        ? { useProxy: true, proxyServer: proxyAddress }
        : { useProxy: false }),
    })
  }

  // The X11 applications in this image do not render when both the outer compositor and Labwc use
  // their software Wayland paths. Force Software Rendering therefore takes precedence over the
  // stored Wayland preference and selects the validated CPU-only X11 path instead.
  const enableWayland = conf.enableWayland && !conf.forceSoftwareRendering

  return sdk.Daemons.of(effects)
    .addDaemon('primary', {
      subcontainer,
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: {
          PUID: '1000',
          PGID: '1000',
          TZ: 'Etc/UTC',
          TITLE: conf.title,
          CUSTOM_USER: conf.username,
          PASSWORD: conf.password,
          PIXELFLUX_WAYLAND: enableWayland ? 'true' : 'false',
          ...(conf.forceSoftwareRendering
            ? {
                AUTO_GPU: 'false',
                SELKIES_USE_CPU: 'true|locked',
                DISABLE_DRI3: 'true',
                DISABLE_ZINK: 'true',
                LIBGL_ALWAYS_SOFTWARE: 'true',
              }
            : {}),
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkWebUrl(effects, 'http://127.0.0.1:' + uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is unreachable'),
          }),
      },
      requires: [],
    })
    .addHealthCheck('electrum-server', {
      // Answers "can this wallet reach its server", by opening the connection the wallet itself
      // makes. The package this was forked from reported the configured server type instead, which
      // is a check that cannot fail and so says nothing.
      ready: {
        display: i18n('Electrum Server'),
        fn: async () => {
          if (!shulcrumAddress)
            return {
              result: 'loading',
              message: i18n('Waiting for the Electrum server to be installed'),
            }
          const res = await subcontainer.exec([
            'bash',
            '-c',
            `exec 3<>/dev/tcp/${shulcrumAddress.replace(':', '/')} && exec 3<&- 3>&-`,
          ])
          // `loading`, not `failure`, when it does not answer. A stopped or still-indexing server
          // is the ordinary state for days, StartOS logs every failed check once a second, and the
          // dependency panel already says the server is not running. Reporting a fault here would
          // fill the log and read as one.
          return res.exitCode === 0
            ? { result: 'success', message: i18n('Connected to Shulcrum') }
            : {
                result: 'loading',
                message: i18n('Waiting for Shulcrum to answer'),
              }
        },
      },
      requires: [],
    })
})
