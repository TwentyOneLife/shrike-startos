import { VersionInfo } from '@start9labs/start-sdk'

export const SPARROW_VERSION = '2.5.4'

export const current = VersionInfo.of({
  version: '2.5.4:0',
  releaseNotes: {
    en_US:
      'Strengthens wallet imports, transaction, payjoin, Electrum, and Bitcoin Core verification, and improves privacy and wallet backup safety; see the [Sparrow 2.5.4 release notes](https://github.com/sparrowwallet/sparrow/releases/tag/2.5.4).',
    es_ES:
      'Refuerza la verificación de importaciones de carteras, transacciones, payjoin, Electrum y Bitcoin Core, y mejora la privacidad y la seguridad de las copias de respaldo; consulta las [notas de la versión Sparrow 2.5.4](https://github.com/sparrowwallet/sparrow/releases/tag/2.5.4).',
    de_DE:
      'Verbessert die Prüfung von Wallet-Importen, Transaktionen, Payjoins, Electrum und Bitcoin Core sowie den Datenschutz und die Sicherheit von Wallet-Sicherungen; siehe die [Versionshinweise zu Sparrow 2.5.4](https://github.com/sparrowwallet/sparrow/releases/tag/2.5.4).',
    pl_PL:
      'Usprawnia weryfikację importów portfeli, transakcji, payjoin, Electrum i Bitcoin Core oraz poprawia prywatność i bezpieczeństwo kopii zapasowych portfela; zobacz [informacje o wydaniu Sparrow 2.5.4](https://github.com/sparrowwallet/sparrow/releases/tag/2.5.4).',
    fr_FR:
      'Renforce la vérification des importations de portefeuilles, des transactions, de payjoin, d’Electrum et de Bitcoin Core, et améliore la confidentialité et la sécurité des sauvegardes ; consultez les [notes de version de Sparrow 2.5.4](https://github.com/sparrowwallet/sparrow/releases/tag/2.5.4).',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
