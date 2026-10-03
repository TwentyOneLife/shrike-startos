# Giving the wallet a camera

## The problem

A SeedSigner talks in QR codes in both directions. The wallet can show one, since the stream
carries its window to your screen. It cannot read one: Settings > Keystore > Airgapped Hardware
Wallet > SeedSigner > Scan answers "No cameras available", in every browser. The SeedSigner row
offers Scan and nothing else, so a wallet that cannot scan cannot import the key, and cannot take a
signed transaction back either. In practice the package is a watch-only wallet.

An earlier decision put camera forwarding out of scope, because Tor Browser withholds the camera at
every security level and Tor is the main way in. That reasoning still holds for Tor Browser. It does
not hold for an ordinary browser on the local network, and that turned out to be the case people
need.

## Why it happens

The image already ships everything a camera needs. Selkies 2 presents the browser's camera to
applications through a preloaded library, `selkies_v4l2_interposer.so`, which answers for
`/dev/video0` without a kernel module. The base image switches it on while the container starts:

```
if NO_WEBCAM is unset and /dev/video0 does not exist and (mknod /dev/video0 or touch /dev/video0):
    enable the webcam, show its toggle, add the interposer to LD_PRELOAD
```

On StartOS `mknod` is refused, so `touch` leaves an empty regular file. The container's `/dev`
outlives a restart of the service, so on every start after the first the file is already there, the
condition is false, and the whole block is skipped. Nothing is preloaded, the server refuses camera
frames, and the toggle is hidden.

Read from an installed package, and reproduced on the built image by creating the file before
`/init`:

```
                         /dev/video0              LD_PRELOAD of the wallet     webcam enabled
fresh /dev               character device 81,0    selkies_v4l2_interposer.so   true
file left from a start   empty regular file       (empty)                      (unset)
```

## Alternatives considered

**Leave it out of scope and say so.** Honest, and costs nothing. Rejected as the answer on its own:
the package would be documented as watch-only for the signer it was built around. The instructions
still need to say that Tor Browser cannot scan, whatever else is done.

**Remove the stale file and stop there.** One line in `docker_entrypoint.sh`, which already clears
things a previous start left behind. This restores what the base image intends: the camera is off
until the user opens the sidebar and switches it on. It works, but a user who presses Scan first
gets the same "No cameras available" as today, because the virtual camera only exists after the
first frame arrives.

**Remove the stale file and ask for the camera on demand.** `SELKIES_WEBCAM_ON_START=demand`
creates the virtual camera when a browser connects, asks the browser for the real one only while an
application holds it open, and lets go two seconds after it is closed. Pressing Scan is then the
whole procedure. Chosen.

**Own the wiring instead of relying on the base's block.** Set `NO_WEBCAM`, enable the webcam in
the image's environment and preload the interposer for the wallet process alone in `autostart`.
Narrower, since only the wallet loads the library, and immune to the base changing its condition.
It is also more of the base image's job taken on here, and it has to be kept in step with Selkies by
hand. Held in reserve for the day the base's block changes shape.

**A kernel loopback camera (`v4l2loopback`).** Needs a kernel module the host does not have and a
package cannot load. Not possible.

## The change

- `docker_entrypoint.sh`: remove `/dev/video0` when it is a regular file, before `/init`.
- `Dockerfile`: `SELKIES_WEBCAM_ON_START=demand`.
- `instructions.md` and `README.md`: scanning needs an ordinary browser on a secure origin, which
  means the package's `https` address with the server's root certificate trusted, or `localhost`
  through a tunnel. Over plain `http` the browser offers no camera at all, which looks exactly like
  this bug. The browser asks for the camera when Scan is pressed. Tor Browser cannot do this.
- `hardening-check.sh`: start the image with `mknod` refused and the stale file in place, and
  require the interposer in the wallet's memory map. This is the regression test for the bug above;
  it fails on the image as it was and passes on this one.

## Risks

**The camera is a new input into a wallet container.** Frames are accepted only from the
authenticated session, only while the wallet has the scanner open, and the browser shows its own
indicator. Microphone, audio and gamepad stay locked off.

**What is held up to the camera travels to the server.** An xpub or a signed transaction is meant to
go there. A SeedQR is not, and the instructions must say never to show one to this camera.

**The library is loaded into every process of the session**, not just the wallet, as the base image
does it. It intercepts calls on `/dev/video0` and passes everything else through. The session
contains the wallet and a window manager and nothing else.

**Tor Browser users gain nothing from this.** They still cannot scan, the SeedSigner row offers no
file import, and carrying a key in through the clipboard is untested. That gap stays open and the
instructions must not imply otherwise.

**A slow answer to the permission prompt leaves the first scan black.** The wallet's capture
library gives up when no frame arrives within a few seconds of opening the device, and does not
try again. Measured with the browser's grant delayed: 1.5 seconds, frames flow; 7 seconds,
`Select timeout` and none. Seen on an installed package with a person answering the prompt.
Closing the scanner and pressing Scan again works once the browser remembers the permission. The
alternative, asking for the camera when the session connects, keeps the camera on for the whole
session and was not taken. The timeout is the wallet's, so the lasting fix belongs there.

**The base's condition may change again.** The image is pinned by digest and the test above fails
if a bump breaks this.

## Test plan

Done on the built image, with a browser whose camera is a still picture of a QR code:

```
Chromium, H.264 uplink   device listed by libopenpnp-capture, 1280x720 YU12, QR decodes from a captured frame
Firefox, JPEG uplink     device listed, frames captured
Scan on the SeedSigner row, in the streamed wallet
                         keystore imported: Airgapped Wallet (Seedsigner), fingerprint and xpub as encoded
X11 and Wayland session  wallet carries the interposer in both
```

The Scan row was run on the image built from this change, in its default Wayland session, started
the way the regression test starts it. The Chromium rows were also run a second time with `mknod` refused (`--cap-drop=MKNOD`), so that
`/dev/video0` is the regular file it will be on StartOS and not a real device node. Same result.
The Firefox row used the browser's built-in test picture, which is not a QR code.

Still to do before release, on an installed package with a real SeedSigner and a real webcam: import
the key, scan a signed transaction back, and repeat after a service restart, since the restart is
what broke it. Watch that the scan window survives the seconds it takes to answer the browser's
permission prompt, which the test browser granted silently.
