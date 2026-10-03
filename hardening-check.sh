#!/bin/sh
# Checks that the built image is what the README says it is.
#
# Every claim here was true when written and none of it is enforced by anything else. The image is
# assembled by removing things from a base image that moves under us at every digest bump, and that
# base has already moved twice in ways that mattered: a helper relocated to /usr/local/bin between
# Selkies versions, and removing one terminal promoted the next into its place. A removal that
# silently stops removing looks exactly like a removal that works.
#
# Usage: hardening-check.sh [image-tag]
set -eu

IMAGE="${1:-shrike-webtop:check}"
NAME="hardening-check-$$"
USER_NAME=probe
PASS=probepass
failures=0

fail() { echo "  FAIL: $1"; failures=$((failures + 1)); }
pass() { echo "  ok: $1"; }

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

# Started the way a second start looks on a host that refuses device nodes: no mknod, and the empty
# file the first start left at /dev/video0 already in place. That is the condition under which the
# wallet once lost its camera, and a plain `docker run` never produces it.
echo "Starting $IMAGE"
docker run -d --rm --name "$NAME" --shm-size=1g --cap-drop=MKNOD \
  -e CUSTOM_USER="$USER_NAME" -e PASSWORD="$PASS" \
  --entrypoint sh "$IMAGE" -c 'touch /dev/video0 && exec /usr/local/bin/docker_entrypoint.sh' >/dev/null

# The interface is served by nginx, which comes up well before the desktop session does. Waiting on
# it rather than sleeping a fixed time, so a slow runner does not produce a false failure.
i=0
until docker exec "$NAME" sh -c 'curl -s -o /dev/null http://127.0.0.1:3000/' 2>/dev/null; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && { echo "  FAIL: the interface never answered"; exit 1; }
  sleep 2
done

echo "No terminal in a wallet session"
# footclient is named explicitly: the base image's own DISABLE_TERMINALS list misses it, and it was
# left executable while foot and st were chmod 0000.
for t in xterm lxterm uxterm koi8rxterm foot footclient st alacritty kitty; do
  if docker exec "$NAME" sh -c "test -e /usr/bin/$t" 2>/dev/null; then
    fail "$t is present"
  fi
done
[ "$failures" -eq 0 ] && pass "no terminal emulator found"

echo "No tools for reaching the network from inside the session"
before=$failures
for t in ssh scp nc netcat ncat socat gpg wget telnet; do
  if docker exec "$NAME" sh -c "command -v $t >/dev/null 2>&1" 2>/dev/null; then
    fail "$t is present"
  fi
done
[ "$failures" -eq "$before" ] && pass "none of ssh, scp, netcat, gpg, wget found"

echo "No application catalogue"
before=$failures
docker exec "$NAME" sh -c 'test ! -e /proot-apps' 2>/dev/null || fail "/proot-apps is present"
docker exec "$NAME" sh -c 'test ! -e /usr/local/bin/selkies-proot' 2>/dev/null ||
  fail "selkies-proot is present"
docker exec "$NAME" sh -c 'test ! -e /selkies-proot' 2>/dev/null ||
  fail "/selkies-proot is present"
docker exec "$NAME" sh -c '! grep -rq "raw.githubusercontent.com/linuxserver/proot-apps" /usr/share/selkies' 2>/dev/null ||
  fail "the catalogue URL is still in the served assets"
[ "$failures" -eq "$before" ] && pass "catalogue and its listing URL are gone"

echo "The interface refuses connections without the password"
before=$failures
code=$(docker exec "$NAME" sh -c "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/")
[ "$code" = "401" ] || fail "expected 401 without credentials, got $code"
code=$(docker exec "$NAME" sh -c "curl -s -o /dev/null -w '%{http_code}' -u $USER_NAME:$PASS http://127.0.0.1:3000/")
[ "$code" = "200" ] || fail "expected 200 with credentials, got $code"
[ "$failures" -eq "$before" ] && pass "401 without, 200 with"

echo "The streaming settings this package sets are the ones in force"
before=$failures
# The server prints what it resolved, which is the only place a setting that was ignored shows up.
# Locked settings matter here: unlocked, a page may turn audio back on, which is how we found that
# SELKIES_AUDIO_ENABLED=false alone was a suggestion rather than a control.
i=0
while [ "$i" -lt 60 ]; do
  line=$(docker logs "$NAME" 2>&1 | grep -m1 "starting:" || true)
  [ -n "$line" ] && break
  i=$((i + 1))
  sleep 2
done
[ -n "$line" ] || fail "the server never reported its settings"
case "$line" in
  *"audio off"*) ;; *) fail "audio is not off: $line" ;;
esac
case "$line" in
  *"gamepads off"*) ;; *) fail "gamepads are not off: $line" ;;
esac
case "$line" in
  *"fixed 1280x800"*) ;; *) fail "the desktop is not pinned to 1280x800: $line" ;;
esac
case "$line" in
  *"8-15 fps"*) ;; *) fail "the framerate ceiling is not 8-15: $line" ;;
esac
[ "$failures" -eq "$before" ] && pass "audio off, gamepads off, fixed 1280x800, 8-15 fps"

echo "The wallet has a camera on a start that is not the first"
before=$failures
# Read from the wallet process itself. The camera is a library loaded into it, so the environment
# the container was given says nothing; what the process has mapped does.
i=0
pid=""
while [ "$i" -lt 60 ]; do
  pid=$(docker exec "$NAME" sh -c 'pgrep -f /opt/shrike/bin/Shrike | head -1' 2>/dev/null || true)
  [ -n "$pid" ] && break
  i=$((i + 1))
  sleep 2
done
if [ -z "$pid" ]; then
  fail "the wallet never started"
else
  docker exec -u abc "$NAME" sh -c "grep -q selkies_v4l2_interposer /proc/$pid/maps" 2>/dev/null ||
    fail "the wallet process does not carry the camera library"
fi
# The same block of the base image that loads the library also tells the server to accept frames,
# and the image asks for the camera only while the scanner is open.
docker exec "$NAME" sh -c 'grep -qx true /run/s6/container_environment/SELKIES_WEBCAM_ENABLED' 2>/dev/null ||
  fail "the server was not told to accept a camera"
docker exec "$NAME" sh -c 'grep -qx demand /run/s6/container_environment/SELKIES_WEBCAM_ON_START' 2>/dev/null ||
  fail "the camera is not requested on demand"
[ "$failures" -eq "$before" ] && pass "camera library loaded in the wallet, server accepting it on demand"

echo
if [ "$failures" -eq 0 ]; then
  echo "All hardening claims hold."
else
  echo "$failures hardening claim(s) no longer hold. The README says otherwise; fix one or the other."
  exit 1
fi
