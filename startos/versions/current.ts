import { VersionInfo } from '@start9labs/start-sdk'

export const SPARROW_VERSION = '2.5.3.1'

export const current = VersionInfo.of({
  version: '2.5.3:1',
  releaseNotes: {
    en_US: `Add software rendering compatibility options.`,
    es_ES: `Agregue opciones de compatibilidad de renderizado por software.`,
    de_DE: `Fügen Sie Software-Rendering-Kompatibilitätsoptionen hinzu.`,
    pl_PL: `Dodaj opcje zgodności renderowania oprogramowania.`,
    fr_FR: `Ajoutez des options de compatibilité de rendu logiciel.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
