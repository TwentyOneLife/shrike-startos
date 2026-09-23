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

1. **Prove the wallet renders in Tor Browser.** The interface is served over Tor and refuses
   connections without its password, both confirmed. It did **not** render: Tor Browser withholds
   the WebCodecs API to resist fingerprinting, and the Selkies 1.x client refused to start without
   it. The image now runs Selkies 2, which sends JPEG frames instead of failing, and the wallet
   paints in a browser with that resistance switched on, verified by reading the canvas and by a
   screenshot. See `docs/design/selkies-2.md`.

   What remains is the part no local test can stand in for: **that it is usable over the real onion
   address**, where the latency is. Tied to it, because the signing path depends on it, is whether
   an animated QR code stays legible through the stream. Both are hand tests over Tor.
2. **Release plumbing: done and proven.** A tag builds, signs the checksums and verifies that
   signature against the published key before publishing, checked end to end on a throwaway tag.
   Releases are marked prerelease until the two open gates below are closed.
3. **Offer the streaming measurement upstream.** The package this was forked from streams the whole
   screen at a fixed rate: measured on their own image with a browser watching, 73.7 percent of a
   CPU core against 13.1 percent with that off. Neither costs anything when nobody is watching. A
   fair trade for a desktop, a poor one for a wallet on a server.
4. **Build for arm64.** The image is x86_64 only; the architecture mapping is already in place.
5. **Prove a wallet syncs end to end**, including across the chain's activation height. This waits
   on a server with a full index.

## Not planned

- A wallet with its own web interface. Shrike is a desktop application and this packages it as one.
- Hardware wallet support. Nothing is passed through from the server, so signing belongs on the
  machine holding the device.

License: GPLv3. Shrike itself is Apache-2.0.
