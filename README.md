# shrike-startos

[Shrike](https://github.com/privkeyio/shrike), a wallet for the Bitcoin Blake2b chain, packaged for
StartOS as a desktop you reach from a browser.

Forked from [`remcoros/sparrow-webtop-startos`](https://github.com/remcoros/sparrow-webtop-startos),
which does the same for Sparrow on Bitcoin. Their work is what made this a small change rather than
a project.

## What this is for

The ordinary way to use Shrike is on your own computer, pointed at a Shulcrum server. This package
is for reaching a wallet through the server's own address instead, including over Tor. The cost is
that the wallet and its keys live on an always-on machine, so read `instructions.md` before putting
money in it.

## How it differs from the package it was forked from

- **The image is built here**, from the `Dockerfile` in this repository, rather than pulled from a
  registry, so the package can be rebuilt from what it publishes.
- **The wallet's release is verified before it is installed**, against the signing key committed in
  `keys/`, matched by full fingerprint. No key is fetched from the network while the image builds.
- **The session is a wallet, not a desktop.** No terminal, no file manager, no editor, and sudo is
  disabled.
- **The base image's application catalogue is removed**, not hidden. It installs arbitrary desktop
  software into the container that holds the wallet's files, and its panel fetches a listing from a
  third party. The switch that is meant to hide it takes effect only after the client and server
  finish a handshake, so the panel is live in the meantime. `strip-proot-apps.sh` takes it out of
  the image and fails the build if a base update moves it.
- **One server:** Shulcrum, required and connected automatically. The chain has no public Electrum
  servers, and the servers for Bitcoin cannot read it.

## Releases

Releases are signed. [`docs/verifying-a-release.md`](docs/verifying-a-release.md) explains how to
check one, and why the two signatures a package carries answer different questions.

## Design

`docs/design/shrike-web-app.md` records what was decided and why, including what was rejected.

## Building

```sh
make                  # the .s9pk
docker build .        # the image on its own
```

## License

GPL-3.0, as the package this was forked from. Shrike itself is Apache-2.0.
