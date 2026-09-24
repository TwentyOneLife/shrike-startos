import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'shrike',
  // "Unofficial" in the title itself, not only in the description: this is the string StartOS shows
  // in a list, and a condition of using the wallet's mark is that nobody reads a third-party build
  // as one of theirs. Agreed with a Shrike collaborator, privkeyio/shrike#67, 2026-09-24.
  title: 'Shrike (unofficial)',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/TwentyOneLife/shrike-startos',
  upstreamRepo: 'https://github.com/privkeyio/shrike',
  marketingUrl: 'https://shrikewallet.com/',
  donationUrl: 'https://github.com/privkeyio/shrike',
  description: {
    short: {
      en_US:
        'Unofficial package of the Bitcoin Blake2b wallet, in your browser',
    },
    long: {
      en_US:
        "Shrike is a desktop wallet for the Bitcoin Blake2b chain, a fork of Sparrow. This package runs it on your server and serves it to your browser, connected to your own Shulcrum Electrum server.\nThis is an unofficial package, built by TwentyOne.Life rather than by the wallet's authors. Shrike is developed at shrikewallet.com; its name and its bird are theirs, used with permission. Report problems with the package here, not to them.\nHow much this holds is your choice. A watch-only wallet paired with an airgapped signer keeps the keys off the server entirely; putting a seed in it makes it a hot wallet on an always-on machine. The interface login and the wallet's own password protect it either way.",
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
      arch: ['x86_64', 'aarch64'],
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
