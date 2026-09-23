# Contributing

Thanks for looking. This repository packages [Shrike](https://github.com/privkeyio/shrike), a wallet
for the Bitcoin Blake2b chain, as a StartOS `.s9pk` that serves the wallet to a browser. Issues and
pull requests are welcome.

It is a fork of [`remcoros/sparrow-webtop-startos`](https://github.com/remcoros/sparrow-webtop-startos),
which packages Sparrow for Bitcoin the same way. Fixes that are not specific to this chain belong
there as well as here.

Everything in this repository is GPLv3, and contributions are accepted under that licence. Shrike
itself is Apache-2.0.

## Building it

You need Docker, Node and `start-cli`. Nothing has to be installed on the host beyond those.

```sh
npm ci
make x86
```

The build compiles nothing: it downloads Shrike's published `.deb`, verifies it against the key in
`keys/`, and packs the image. A first build takes a few minutes, mostly spent on the base image.

To work on the desktop image alone:

```sh
docker build -t shrike-webtop:local .
docker run --rm -p 3000:3000 -e CUSTOM_USER=you -e PASSWORD=something shrike-webtop:local
```

## What a change has to clear

- **The wallet's signing key is pinned by fingerprint**, in the Dockerfile and again in CI. Changing
  the key this package trusts is a change of publisher, and it has to be visible as one.
- **No terminal, no file manager, no sudo in the session.** This is a wallet, not a desktop, and
  every extra application in it is another way to reach the wallet's files from a browser tab.
- **Nothing that costs a core while idle.** The node this runs on is doing other work.
- **A health check must be able to fail**, and must not report a fault for a state that is ordinary
  for days.
- Formatting and types are checked in CI, and so is the absence of private addresses and paths.

## Releases

A tag beginning with `v` builds the package, signs the checksums with the release key, verifies that
signature against the key published in `keys/`, and attaches everything to the release. See
[`docs/verifying-a-release.md`](docs/verifying-a-release.md).
