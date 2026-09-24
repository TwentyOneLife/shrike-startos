import { sdk } from '../sdk'
import { T, utils } from '@start9labs/start-sdk'
import { createDefaultStore, store } from '../fileModels/store.yaml'
import { i18n } from '../i18n'

const { InputSpec, Value, Variants } = sdk

export const inputSpec = InputSpec.of({
  title: Value.text({
    name: 'Browser Tab Title',
    description:
      'This value will be displayed as the title of your browser tab.',
    required: true,
    default: 'Shrike',
    placeholder: 'Shrike',
    patterns: [utils.Patterns.ascii],
  }),
  username: Value.text({
    name: 'Username',
    description: 'The username for logging into the wallet interface.',
    required: true,
    default: 'shrike',
    placeholder: '',
    masked: false,
    patterns: [utils.Patterns.ascii],
  }),
  password: Value.text({
    name: 'Password',
    description: 'The password for logging into the wallet interface.',
    required: true,
    generate: {
      charset: 'a-z,0-9',
      len: 20,
    },
    default: { charset: 'a-z,0-9', len: 20 },
    placeholder: '',
    masked: true,
    // This gate is HTTP Basic auth in front of a wallet that holds keys, and the interface may be
    // reachable over Tor. Eight characters is a rule for a login that locks out; this one does not.
    // The generated value is twenty and is the one to keep.
    minLength: 16,
  }),
  enableWayland: Value.toggle({
    name: i18n('Enable Wayland'),
    description: i18n(
      'Use the Wayland desktop backend. Disable this for the older X11 compatibility backend. Force Software Rendering takes precedence and uses X11.',
    ),
    default: true,
  }),
  network: Value.select({
    name: 'Network',
    description:
      'Which chain the wallet runs on. Shrike runs one network per process, so changing this restarts the service and the wallet reopens on the other chain. Wallets are kept separately per network and are not lost by switching.',
    default: 'mainnet',
    values: {
      mainnet: 'Mainnet',
      testnet4: 'Testnet4',
    },
  }),
  testnet4Server: Value.text({
    name: 'Testnet4 Electrum server',
    description:
      'Only used on testnet4, as host:port. On mainnet the wallet connects to Shulcrum on this server and this is ignored. No package serves testnet4 for this chain yet, so if you select that network you have to say where a server is. Leave it empty and the wallet will start on testnet4 with no server configured. An onion address works and is routed through Tor automatically; anything else is connected to directly. Prefix with ssl:// if the server serves TLS, which the onion address on a StartOS interface page does.',
    required: false,
    default: null,
    placeholder: 'electrum.example:50011',
    inputmode: 'url',
    patterns: [
      {
        regex: '^$|^(tcp://|ssl://)?[A-Za-z0-9.:_-]+:[0-9]{1,5}$',
        description:
          'A host and port, for example electrum.example:50011, optionally prefixed with tcp:// or ssl://',
      },
    ],
  }),
  forceSoftwareRendering: Value.toggle({
    name: i18n('Force Software Rendering'),
    description: i18n(
      'Use the CPU-only X11 compatibility path without graphics devices. Enable this if the Web UI is blank or unstable because of incompatible graphics hardware. This overrides Enable Wayland, is slower, and takes effect after restart.',
    ),
    default: false,
  }),
})

export const config = sdk.Action.withInput(
  // id
  'config',

  // metadata
  async ({ effects }) => ({
    name: 'Settings',
    description: i18n(
      'Interface login, rendering, and how the wallet connects',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => readSettings(effects),

  // the execution function
  ({ effects, input }) => writeSettings(effects, input),
)

type InputSpec = typeof inputSpec._TYPE
type PartialInputSpec = typeof inputSpec._PARTIAL

async function readSettings(effects: T.Effects): Promise<PartialInputSpec> {
  let settings = await store.read().once()
  if (!settings) {
    await createDefaultStore(effects)
    settings = (await store.read().once())!
  }

  return {
    title: settings.title,
    username: settings.username,
    password: settings.password,
    enableWayland: settings.enableWayland,
    network: settings.network,
    testnet4Server: settings.testnet4Server || null,
    forceSoftwareRendering: settings.forceSoftwareRendering,
  }
}

async function writeSettings(effects: T.Effects, input: InputSpec) {
  await store.merge(effects, {
    title: input.title,
    username: input.username,
    password: input.password,
    enableWayland: input.enableWayland,
    network: input.network,
    testnet4Server: input.testnet4Server ?? '',
    forceSoftwareRendering: input.forceSoftwareRendering,
  })
}
