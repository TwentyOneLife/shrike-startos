# Shrike

Shrike is a wallet for the Bitcoin Blake2b chain, a fork of Sparrow. This package runs it on your
server and shows it in your browser, connected to your own Shulcrum server.

## Read this first: the keys are on your server

A wallet with its keys on an always-on machine is a hot wallet. Whoever reaches this interface
controls the money in it.

- **Use a watch-only wallet here** and sign transactions on a hardware wallet or an offline
  computer, moving them as files. This package cannot use a USB hardware wallet directly, because
  nothing is passed through from the server.
- **Reach it over Tor,** or over your local network, rather than exposing it to the internet.
- **Set a strong interface password**, in Settings. It is what stands between a browser and your
  wallet.
- **Your backups contain your wallets.** A StartOS backup of this package includes the wallet files.
- **Signatures made here can be replayed on Bitcoin** unless the transaction opts out. That is a
  property of the chain, not of this package.

If you want a wallet that holds savings, run Shrike on your own computer instead and point it at
Shulcrum on this server. That path needs no package at all.

## Getting started

1. **Set the login** in Settings, under Actions. The interface refuses connections without it.
2. **Open the interface.** Shrike starts by itself, already pointed at Shulcrum.
3. **Create or import a wallet.** File, then New Wallet or Import Wallet.

## What is connected

Shrike is configured to use Shulcrum on this server as its Electrum server, over the local bridge,
and the package sets that at every start. If you change the server inside the wallet, the next
restart of this service sets it back.

The "Electrum Server" health check opens the same connection the wallet uses, so it tells you
whether the wallet can see the chain, not merely what it is configured to use.

## While Shulcrum is still indexing

Shulcrum answers wallet queries only once it has finished building its index, which takes days on a
first run. Until then this wallet will show as disconnected, and the health check will say so. That
is expected, and nothing here needs changing while you wait.

## Limitations

- No USB devices, so hardware wallets cannot be plugged into the server.
- One user at a time.
- The clipboard between your computer and the wallet depends on what your browser allows.
