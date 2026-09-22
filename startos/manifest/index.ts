import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'shrike',
  title: 'Shrike',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/TwentyOneLife/shrike-startos',
  upstreamRepo: 'https://github.com/privkeyio/shrike',
  marketingUrl: 'https://github.com/privkeyio/shrike',
  donationUrl: 'https://github.com/privkeyio/shrike',
  description: {
    short: {
      en_US: 'Bitcoin Blake2b wallet in your browser',
    },
    long: {
      en_US:
        'Shrike is a desktop wallet for the Bitcoin Blake2b chain, a fork of Sparrow. This package runs it on your server and serves it to your browser, connected to your own Shulcrum Electrum server.\nThe wallet and its keys live on the server, so it is a hot wallet. Use watch-only wallets here and sign on a hardware or offline device unless you accept that.',
    },
  },
  volumes: ['main', 'userdir'],
  images: {
    main: {
      source: {
        // Built from the Dockerfile in this repository, not pulled from a registry: a package that
        // installs a wallet should be rebuildable from the source it publishes.
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: ['x86_64'],
    },
  },
  hardwareAcceleration: true,
  dependencies: {
    fulcrum: {
      description: 'Serves the Bitcoin Blake2b chain to this wallet.',
      optional: false,
      metadata: {
        title: 'Shulcrum',
        icon: 'https://raw.githubusercontent.com/TwentyOneLife/shulcrum-startos/main/icon.png',
      },
    },
    tor: {
      description: "Routes the wallet's own connections through Tor.",
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
