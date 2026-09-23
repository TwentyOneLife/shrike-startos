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
    forceSoftwareRendering: settings.forceSoftwareRendering,
  }
}

async function writeSettings(effects: T.Effects, input: InputSpec) {
  await store.merge(effects, {
    title: input.title,
    username: input.username,
    password: input.password,
    enableWayland: input.enableWayland,
    forceSoftwareRendering: input.forceSoftwareRendering,
  })
}
