# Shrike

Shrike is a wallet for the Bitcoin Blake2b chain, a fork of Sparrow. This package runs it on your
server and shows it in your browser, connected to your own Shulcrum server.

## Read this first: the keys are on your server

A wallet with its keys on an always-on machine is a hot wallet. Whoever reaches this interface
controls the money in it.

- **Use a watch-only wallet here** and sign transactions on a hardware wallet or an offline
  computer. This package cannot use a USB hardware wallet directly, because nothing is passed
  through from the server. Moving an unsigned transaction out and a signed one back in is not yet a
  tested path in this package, so treat it as unproven rather than routine.
- **Reach it over your local network, or over Tor.** The interface is served over a Tor address if
  you add one, and that has been tested only as far as the page loading: whether the desktop itself
  renders in Tor Browser on its default settings is still unverified.
- **Keep the password the Settings action generates.** It is twenty characters, and the check in
  front of the interface is HTTP Basic auth over the connection StartOS provides. That is a lock on
  a door, not a vault: it does not rate limit and it does not lock out, so a short password is worth
  little and the interface does not belong on the open internet.
- **Set a password on the wallet itself** when you create it. That is what protects a wallet file
  that leaves this machine, in a backup or otherwise. The interface password protects the session;
  the wallet password protects the file.
- **Your backups contain your wallets,** and also the interface password, which is stored in plain
  text in this package's settings file. Treat a backup of this service as you would treat the wallet.
- **Replay between the chains is about coins older than the fork.** A transaction spending coins
  that existed before the fork can be valid on both chains, in either direction. Coins received
  after it exist on one chain only and cannot be replayed. Shrike carries opt-in protection for the
  case that matters; check the signing screen when you spend pre-fork coins.

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
