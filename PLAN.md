# Roadmap

Package [Shrike](https://github.com/privkeyio/shrike), a wallet for the Bitcoin Blake2b chain, as a
StartOS service that serves the wallet to a browser, including over Tor.

The ordinary way to use Shrike is on your own computer, pointed at a Shulcrum server. This package
is the other way: the wallet runs on the server. That is a hot wallet, and the design says what
follows from it.

## Done

- **The spec**, before any code: `docs/design/shrike-web-app.md`.
- **The image**, built here rather than pulled, with the wallet's release verified against a key
  committed to this repository, matched by full fingerprint, and a session that carries the wallet
  and nothing else.
- **The package**: Shulcrum as a required dependency, the wallet connected on arrival, and a health
  check that opens the connection the wallet itself makes.
- **CI**: formatting, types, the `.s9pk` build, and a guard against publishing private addresses.
- **Installed and running** on a StartOS node, and reachable over its Tor address.

## Next

1. **The wallet renders over Tor: done.** It did not, at first. Tor Browser withholds the WebCodecs
   API to resist fingerprinting and the Selkies 1.x client refused to start without it. The image
   runs Selkies 2, which sends JPEG frames instead of failing. Proven over a real onion address, and
   then tuned for it: left alone the client asked for 2800x1200 at 60 frames a second, which no
   onion circuit carries. See `docs/design/selkies-2.md` for the measurements and for two things
   that were tried and reverted.
2. **Release plumbing: done and proven.** A tag builds, signs the checksums and verifies that
   signature against the published key before publishing, checked end to end on a throwaway tag.
   Releases are published rather than marked prerelease. What is not yet tested is named at the
   top of the release notes, which is where someone deciding whether to install it will read it.
3. **Offer the streaming measurement upstream.** The package this was forked from streams the whole
   screen at a fixed rate: measured on their own image with a browser watching, 73.7 percent of a
   CPU core against 13.1 percent with that off. Neither costs anything when nobody is watching. A
   fair trade for a desktop, a poor one for a wallet on a server.
4. **Build for arm64: done.** Both architectures are built and released. The wallet publishes an
   arm64 package of its own, and the base image is a multi-architecture index, so nothing needed
   cross-compiling; the arm64 image is assembled under emulation, which works and is slow.
5. **Prove a wallet syncs end to end**, including across the chain's activation height. This waits
   on a server with a full index, which is the one thing here that cannot be hurried. Everything
   short of it is proven: the wallet reaches the configured server, completes a protocol 1.8
   handshake, subscribes to its addresses, and verifies proof of work on the header it is given.

## Not planned

- A wallet with its own web interface. Shrike is a desktop application and this packages it as one.
- **USB hardware wallet support.** Nothing is passed through from the server, so a device plugged
  into your computer cannot be reached from a wallet running on the server.

  Signing with an airgapped device is a different matter and **is** the intended path: the wallet
  draws a QR code on its own desktop and the stream carries it to the screen a signer is pointed at.
  The return leg, getting a signed transaction back without a camera on the server, is designed but
  not yet proven, and `instructions.md` says so rather than implying it is routine.

License: GPLv3. Shrike itself is Apache-2.0.
