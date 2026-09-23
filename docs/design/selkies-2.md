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

## Addendum, measured over Tor

The first build rendered over Tor and was slow enough to be unpleasant: menus lagged and typing ran
seconds behind. The node's log named the cause without ambiguity.

```
Stream settings active -> Res: 2800x1200 | FPS: 60.0 | Stripes: 4 | Mode: JPEG | Quality: 60
Backpressure TRIGGERED for 'primary'. S:3086, C:957 (EffDesync:19.0f > Allowed:16.0f)
```

The client asked for a HiDPI screen at sixty frames a second, the circuit carried a fraction of it,
and the server spent its time triggering and lifting backpressure while a queue of frames built up.
A keystroke waited behind that queue rather than behind the round trip alone. The node itself was
idle throughout, so this was never a question of CPU.

Two settings answer it. A framerate ceiling of 15, and `use_css_scaling`, which sends one pixel per
CSS pixel rather than one per device pixel and lets the canvas stretch. Measured on the same image
afterwards: 1280x900 at 15 fps, roughly twelve times fewer pixels per second. Neither is locked,
because a local network has the bandwidth for more and the side menu can raise both.

**Settings are defaults unless they are locked.** Upstream is explicit that clients may override a
value unless a `|locked` suffix is given, and it is easy to ship a switch that does nothing. Proven
on this image: with audio off but unlocked, the side menu still offered a working "Enable Audio
Stream" button; locked, the button is gone. Audio, microphone and gamepad are locked here for that
reason. The gamepad *toggle* is still drawn either way, so the honest claim is that the server
refuses gamepads rather than that the button is gone.

This is the same lesson as the application catalogue, in a second place: a setting that the page
applies is a rendering default, not a control. Treat anything that matters as needing either a lock
or removal from the image.

## Addendum: the desktop is pinned, not negotiated

By default the session takes its size from the page that is watching it. That sounds reasonable and
is not: the page's layout is not a statement about how big a desktop should be. Observed on the
node, with a browser's developer console open, the client asked in sequence for 1400x700, then
1400x200, then 1400x100, and the session obliged each time. What was left was a hundred-pixel strip,
which reads as a black screen, and the wallet looked broken when nothing was wrong with it.

Pinned to 1920x1080 with `manual_resolution`, the window becomes a viewport onto a stable desktop
rather than a command to reshape it. Verified against a 1400x120 viewport: the client reports
`Manual Mode: true` and the server holds `Res: 1920x1080`, where before it would have followed.

The second benefit is quieter and possibly larger: a dragged window edge no longer re-encodes the
whole screen.

**The size was wrong at first, and the correction is the point.** Pinned at 1920x1080 on the
reasoning that it is what desktop software is laid out for. Measured over Tor immediately
afterwards: `S:1091, C:174`, the server a thousand frames ahead of the browser, and timing the
recovery between two log lines the circuit was delivering about 2.5 frames a second against the 15
being produced. That is 2.07 megapixels a frame where the working configuration had been 1.02. The
size argument was sound and irrelevant; the bandwidth had already been measured an hour earlier and
was not consulted. Pinned at 1280x800 instead, which is a normal desktop size, lays dialogs out
fine, and costs what the link can carry. Size is paid for on every frame: decide it against the
measurement, not against what desktops usually are.
