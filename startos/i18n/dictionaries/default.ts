export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'The web interface is ready': 1,
  'Password is required': 3,
  'The web interface is unreachable': 4,
  'Electrum Server': 13,
  'Waiting for the Electrum server to be installed': 14,
  'Connected to Shulcrum': 15,
  'Shulcrum is not answering': 16,
  'Interface login, rendering, and how the wallet connects': 17,

  // interfaces.ts
  'Web Interface': 100,

  // actions/config.ts
  'Enable Wayland': 306,
  'Use the Wayland desktop backend. Disable this for the older X11 compatibility backend. Force Software Rendering takes precedence and uses X11.': 307,
  'Force Software Rendering': 308,
  'Use the CPU-only X11 compatibility path without graphics devices. Enable this if the Web UI is blank or unstable because of incompatible graphics hardware. This overrides Enable Wayland, is slower, and takes effect after restart.': 309,
} as const

export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
