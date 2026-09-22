# Design: Shrike as a StartOS package

- **Issue:** #33
- **Status:** draft
- **Repo:** a fork of `remcoros/sparrow-webtop-startos`, which packages Sparrow the same way for
  Bitcoin. Upstream fixes are worth pulling, and ours are worth offering back.

## Problem

Shrike is the Sparrow fork that understands Bitcoin Blake2b. It is a desktop wallet, and the normal
way to use it stays what it is today: Shrike on your own computer, pointed at Shulcrum on your
server. That path is not what this package is for and it is not replaced by it.

What is missing is a way to reach a wallet on the chain from a machine that is not your own
computer, over the server's own address, including over Tor. StartOS serves packages through the
browser, so a package that carries the wallet gives that for free, at the cost of the wallet living
on an always-on machine. That trade is the whole of this design.

## What "native" means here, and what it costs

StartOS packages serve a web interface from the application itself. Shrike has no web interface: it
is a JavaFX desktop application. Something has to turn a desktop window into a web page, and that
part can never be as native as a package whose application speaks HTTP.

Everything around it can be. The package is ordinary StartOS 0.4 in every other respect: one `ui`
interface bound through the SDK, so StartOS gives it TLS, a LAN address and, when the user asks for
one, a Tor address; dependencies resolved by package id; settings through Actions rather than a
config file the user edits; health checks; backups through the SDK's volume list; and an image this
repository builds itself.

### Delivering the window

| | How it reaches the browser | Fits StartOS | Notes |
|---|---|---|---|
| **Selkies** (what upstream uses) | websocket stream, with WebCodecs where the browser allows | yes, one http port | Maintained by linuxserver, best quality on a LAN. Its client wants a secure context, which an onion address satisfies, but whether its decode path works in Tor Browser is **unverified**. |
| **KasmVNC** | websocket VNC | yes, one http port | The base linuxserver superseded; older, but plain and undemanding of the browser. |
| **noVNC with a VNC server** | websocket VNC, plain JavaScript | yes, one http port | The most conservative in a hardened browser, the smallest image, and the easiest to reason about. We would assemble and maintain it ourselves. |
| **Sparrow Server** (`shrikeserver`, a terminal UI) plus a web terminal | websocket terminal | yes, but no wallet GUI | Shrike ships this build. A terminal wallet in a browser is a different product, not this one. |

**Decision: start from Selkies, and treat Tor Browser as a release gate.** It is what upstream
uses, so fixes flow both ways and the diff stays small. If it does not work in Tor Browser on
default settings, the fallback is noVNC, which is a change of image and not of package. The test is
cheap and comes first, before any of the packaging work below (see the test plan).

### The image

Built here, from a `Dockerfile` in this repository, the way `shulcrum-startos` builds Shulcrum. Not
pulled from someone else's registry, which is what upstream does: a package that installs a wallet
should be reproducible from the source we publish, and the `.s9pk` we sign should contain an image
we built.

Inside it:

- the base image pinned by digest, not by a tag that moves;
- Shrike installed from its published `.deb`, verified before installation against `SHA256SUMS` and
  its detached signature, using a **key committed to this repository** rather than fetched from a
  key server at build time. Upstream fetches Sparrow's key over the network during the build and
  matches a long key id; we match the full fingerprint
  `A47D99B6DB0D715D40C59A2023AE8A8EA7E24E38`, which Shrike's README publishes and the release
  author's GitHub account corroborates;
- the terminal and the file manager removed from the desktop menu, and sudo disabled in the
  container. Upstream leaves a shell in the session, which on a wallet machine is a larger surface
  than the wallet;
- Shrike started as the session's only application, with no public-server defaults, since Shrike
  ships no public Electrum servers for this chain.

### The package

- **Id `shrike`,** not `sparrow-webtop`: a different application on a different chain, and it must
  never satisfy something that wanted Sparrow on Bitcoin.
- **Version.** Shrike releases as `2.5.5-blake2b.26`, which is not a StartOS version. The package
  version carries the same information in the form StartOS understands, with the flavor marking the
  chain: `#blake:2.5.5.26:0`, the last component being our packaging revision. Shulcrum's package
  does the same.
- **One dependency, on Shulcrum**, by its package id `fulcrum`, required and running. The version
  range has to be written for our flavored version, which does not satisfy an unflavored range
  directly; Shulcrum's package carries the same note. Upstream's other server choices go: electrs
  and the Bitcoin explorer's server do not serve this chain, and Shrike offers no public servers.
- **Pointing Shrike at Shulcrum** stays as upstream does it: the package resolves Shulcrum's bridge
  address through the SDK and writes Shrike's own config file before the desktop starts, so the
  wallet comes up connected with nothing for the user to type. The file moves from `.sparrow` to
  `.shrike`, and the server type stays `ELECTRUM_SERVER`.
- **Settings through Actions:** the interface password, and whether to use Tor for Shrike's own
  outbound connections. Nothing else; the point of a package is that it arrives configured.
- **Health checks:** the interface answers, and Shulcrum is reachable. Upstream's "connected node"
  check only echoes the configured value and never tests anything, which is worse than no check.
- **Backups:** the wallet directory, which is where Shrike keeps wallets and their settings.

## Security, which is the real question

The wallet lives on a machine that is always on, and whoever reaches the session controls it.

- **The session is the credential.** Access is the StartOS interface with a password set at install,
  and we recommend reaching it over the server's Tor address rather than exposing it further.
- **No shell in the session**, and no second application. A remote desktop that is only a wallet is
  a much smaller thing to defend than a Linux desktop that happens to run one.
- **Watch-only is the recommended shape**, with signing on a hardware or offline device through
  PSBT files. The package cannot pass through a USB device, so a hardware wallet cannot be plugged
  into it, which pushes the same way.
- **Shrike's own wallet password** encrypts the wallet file at rest. It is decrypted in memory while
  the wallet is open, so it protects a stolen backup, not a live session.
- **Backups carry wallets.** The instructions have to say so plainly.
- Signing that is not replay protected is spendable on the chain this one forked from. The
  instructions have to say that too.

None of that makes a hot wallet on a server a good place for savings, and the instructions should
say as much rather than imply otherwise.

## CI and releases

Upstream's workflows call shared workflows at a moving reference and are built around another
project's registry and signing key. Ours follow `shulcrum-startos`: our own workflows, third-party
actions pinned by commit, the image and the `.s9pk` built in CI, the result signed with our release
key, and a release that verifies its own signature against the key we publish before it is
published.

## Alternatives considered

- **Use upstream's package as it is and point it at Shulcrum.** It resolves `fulcrum` already. But
  it installs Sparrow, which cannot read this chain's headers, so it would connect and then fail in
  the way this whole project exists to prevent.
- **Pull upstream's prebuilt image and swap only the package.** Less work, and it leaves the thing
  that installs a wallet outside our control and unverifiable from our source.
- **Ship the headless `shrikeserver` with a web terminal.** A smaller surface and a smaller image,
  but a terminal wallet is not what was asked for. Worth revisiting if the browser desktop turns out
  to be unusable over Tor.
- **Write a web wallet.** Not this project, and not a small one.

## Risks

- **Tor Browser may not run the Selkies client** on default settings. This is the first thing
  tested, and the fallback is a change of image.
- **Usability over Tor** may be poor even where it works: a remote desktop over a high-latency
  connection is not pleasant. The alternative is reaching it on the LAN and using Tor only when
  away.
- **Upstream drift.** We diverge in the image, the id, the dependency and the branding, so pulling
  upstream's fixes will need care. The package code stays close to theirs deliberately.
- **A wallet in a package invites treating it as a main wallet.** Mitigated only by saying so.
- **Shrike's releases are signed by one person's key**, corroborated by their GitHub account but not
  by an independent source. We pin the fingerprint and vendor the key, so a change of key is a
  visible change in this repository rather than a silent one at build time.

## Test plan

1. **Tor Browser, before anything else.** Build the image, run it locally, reach the desktop through
   Tor Browser on default settings. If Selkies fails, switch to noVNC and repeat. This decides the
   image before the packaging work is done.
2. **Install on the node** beside Shulcrum: the dependency resolves, the wallet starts connected,
   and a watch-only wallet syncs its history, including across the fork height.
3. **A transaction end to end:** build it in the browser, sign it on another device from a PSBT
   file, broadcast it through the package.
4. **Access:** the interface on the LAN and over the server's Tor address, both with the password
   set at install.
5. **Backup and restore:** a wallet survives a StartOS backup and restore.
6. **The health checks tell the truth:** stopping Shulcrum shows the dependency as unhealthy rather
   than reporting a connection that is not there.
