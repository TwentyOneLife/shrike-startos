# shrike-startos

[Shrike](https://shrikewallet.com/), a wallet for the Bitcoin Blake2b chain, packaged for StartOS as
a desktop you reach from a browser. The wallet itself is developed at
[`privkeyio/shrike`](https://github.com/privkeyio/shrike); this repository packages it and is not
affiliated with or endorsed by its authors.

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
- **The session is a wallet, not a desktop.** No file manager, no editor, and no terminal: all
  three terminal emulators the base image carries are removed. That distinction is deliberate. The
  base image's own switch chmods a terminal to `0000` rather than removing it, which anything
  running as root undoes, it promotes the next terminal when one goes, and it misses `footclient`
  entirely. Sudo is still present and disabled the base image's way, by permission.
- **Tools a wallet has no use for are removed from the image**: ssh, scp, netcat, gpg and wget. They
  came with the base image. None is reachable without code execution inside the session, so this is
  hardening rather than a fix, but a container holding wallet files is worth less without them.
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
`docs/design/selkies-2.md` covers how the wallet is streamed to a browser: why it could not render
in Tor Browser at all, what was measured to make it usable there, and two changes that were tried
and reverted, with the reasons, so they are not tried again.

## Building

```sh
make                  # the .s9pk
docker build .        # the image on its own
```

## License

GPL-3.0, as the package this was forked from. Shrike itself is Apache-2.0.
