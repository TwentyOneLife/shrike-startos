# Moving the image to Selkies 2

## The problem

The wallet's interface does not render in Tor Browser. The client loads, its sidebar and settings
panels work, and where the desktop should be it prints:

```
Error: Your browser does not support the WebCodecs API required for video streaming.
```

Reaching the interface over Tor is the reason this package exists, so this is not a cosmetic
failure. It is the release gate the design named, and it was failing.

## Why it happens

Selkies 1.x runs a pre-flight that requires `window.VideoDecoder` and fails fatally without it,
before any encoder is chosen. The API is absent because **`privacy.resistFingerprinting` removes
it**, and Tor Browser enables that at every security level. Reproduced with a headless Firefox,
no Tor involved:

```
resistFingerprinting=false  VideoDecoder: function    ImageDecoder: function    createImageBitmap: function
resistFingerprinting=true   VideoDecoder: undefined   ImageDecoder: undefined   createImageBitmap: function
```

WebCodecs advertises exactly which codecs a machine can decode, which is a strong fingerprint, so a
browser built to resist fingerprinting withholding it is that browser working correctly.

Three things follow. No browser update fixes this, and two predictions that it would were wrong: a
Tor Browser point release changed nothing, and stock Firefox 142 exposes all three APIs, so the
Firefox ESR version was never the cause. The preference `dom.media.webcodecs.enabled` reads `true`
in an affected browser and is irrelevant, because the removal happens regardless of it. And the
obvious workaround, asking a user to disable the setting, trades away the anonymity that reaching a
wallet over Tor exists for. It is not offered.

## Alternatives considered

**Delete the fatal pre-flight from the 1.x client.** The smallest possible change, and it does not
work. That client's JPEG path decodes stripes with `ImageDecoder`, which resistFingerprinting
removes too, and gives up with a warning when it is missing. `createImageBitmap` appears twice in
that client and both are the mouse cursor. Removing the check buys a black screen instead of an
error message.

**Switch to a VNC-based client.** Plain JavaScript, needs nothing beyond a canvas, and it would
work. Rejected: it cannot carry a camera, and it was rejected by us for its own reasons before this
question arose.

**Build on Selkies' own images** (`ghcr.io/selkies-project/selkies/base`). Genuinely 2.0 and
released rather than a development line. Their interface differs throughout: port 8080 rather than
3000, `SELKIES_BASIC_AUTH_*` rather than `CUSTOM_USER`/`PASSWORD`, TLS on by default, and no
`/config` or `abc` conventions. Every piece of this package's integration would be rewritten. Held
in reserve, not chosen.

**Wait for the base image's release line to carry 2.x.** Its `-v2` branches exist and pin
`2.0.0rc1`, so it is coming, with no date. Waiting leaves the gate failing for an unknown time.

## The change

Move the base image to the same publisher's development line, which builds Selkies from its main
branch and is therefore 2.x while keeping every convention this package already integrates with:
port 3000, `CUSTOM_USER` and `PASSWORD` through nginx, `/config`, the `abc` user, and the hardening
flags. It is a base swap rather than a rewrite.

In 2.0 an engine without WebCodecs still streams: the pre-flight pins the JPEG encoder instead of
failing, and frames are painted through `createImageBitmap`, the one API that survives. Verified
against the base image with resistFingerprinting on, where the client logs

```
VideoDecoder API unavailable: the stream is pinned to the jpeg encoder.
```

and paints the session. Its video canvas refuses a `2d` readback with `InvalidStateError`, which is
what a `bitmaprenderer` context does, so the frames really do arrive that way.

Settings that changed with 2.0 and are updated here: `SELKIES_H264_STREAMING_MODE` became
`SELKIES_VIDEO_STREAMING_MODE` and is now upstream's own default, the input interposer was renamed,
`DISABLE_ZINK` no longer exists, and audio is switched off. Audio is not merely unwanted in a
wallet: `AudioDecoder` is withheld by the same mechanism, so leaving it on means a worker throwing
on repeat.

## Risks

**The development line tracks Selkies' main branch**, and Selkies 2.0 is itself at `2.0.0rc1`. The
image is pinned by digest, so nothing moves underneath us, but a pin is not maturity. Every bump is
a deliberate act with a test behind it, and the moment the release line carries 2.x this moves
there.

**The distribution changed** from Debian to Ubuntu with this line, which is a larger change than the
Selkies version and touches every package installed on top, the wallet's `.deb` among them.

**Streaming cost.** Measured on a mostly static session: 0.5 percent of a core idle, 32.5 percent
while a browser watches, 0.6 percent once it closes. Between the 73.7 percent that full-frame
streaming cost and the 13.1 percent of the striped default, and only while someone is looking. It
is worth knowing on a machine that also runs a node.

## Test plan

- The image builds, and the wallet's release still verifies against its committed key on the new
  distribution.
- A browser with resistFingerprinting on reaches the session and paints it, checked by reading the
  canvas and by a screenshot rather than by the presence of a canvas element.
- The catalogue removal still holds on the new base: its pieces moved, and the build fails loudly if
  they move again.
- The package's health check still opens a real connection to the server.
- Unchanged and still to be proven by hand over the real onion, because no local stand-in carries
  Tor's latency: that the wallet is usable there, and that an animated QR stays legible through the
  stream, which is what the signing path depends on.
