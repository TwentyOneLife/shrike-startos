#!/bin/sh
# Takes the LinuxServer base image's proot-apps catalogue out of the wallet image.
#
# The catalogue installs arbitrary desktop software into the same container that holds the wallet's
# files, and the sidebar panel driving it fetches its listing from a third party the moment it
# opens. SELKIES_UI_SIDEBAR_SHOW_APPS, which this image also sets, does not prevent either: the
# client applies that flag only once the server's settings arrive over the websocket, so the panel
# renders and is usable before then. Measured on this image, the panel is present at first paint
# and gone 500 ms later. A flag that depends on a handshake completing is not a control.
#
# Every step checks what it is about to change and fails the build when it is not there, because a
# base image update that moves any of this would otherwise turn the removal into a silent no-op.
# That guard has already earned itself once: between Selkies 1.x and 2.0 the helper moved to
# /usr/local/bin and the init script grew a bubblewrap shim pointing into the catalogue.
set -eu

CONFIG_RUN=/etc/s6-overlay/s6-rc.d/init-selkies-config/run
DASHBOARDS='/usr/share/selkies/selkies-dashboard /usr/share/selkies/selkies-dashboard-wish'
CATALOGUE_URL='https://raw.githubusercontent.com/linuxserver/proot-apps/master/metadata/'

# 1. The init script copies the catalogue into the user's home on every start, and points BWRAP at
#    a binary inside it. Home is the persistent volume, so leaving the copy would reinstate what we
#    remove, and leaving BWRAP would name a path that no longer exists.
grep -q '^# add proot-apps$' "$CONFIG_RUN"
grep -q '^# steam shim$' "$CONFIG_RUN"
before=$(wc -l < "$CONFIG_RUN")
awk '
  /^# add proot-apps$/ { skip = 1 }
  /^# steam shim$/     { skip = 0 }
  !skip                { print }
' "$CONFIG_RUN" > "$CONFIG_RUN.new"
mv "$CONFIG_RUN.new" "$CONFIG_RUN"
chmod 755 "$CONFIG_RUN"

removed=$((before - $(wc -l < "$CONFIG_RUN")))
# Bounded rather than exact: the block has already changed size once across a base image, and a
# range still catches the failure that matters, which is the awk running past its closing anchor.
[ "$removed" -ge 20 ] && [ "$removed" -le 40 ] ||
  { echo "expected to remove 20 to 40 lines, removed $removed"; exit 1; }
! grep -qE 'proot|BWRAP' "$CONFIG_RUN" || { echo "proot or BWRAP survives in $CONFIG_RUN"; exit 1; }
grep -q '^# steam shim$' "$CONFIG_RUN"

# 2. The catalogue itself, and the helper the dashboard invokes to drive it. ncat in particular has
#    no business in a wallet container.
test -x /proot-apps/proot-apps
test -x /usr/local/bin/selkies-proot
rm -rf /proot-apps /usr/local/bin/selkies-proot

# 3. The listing the panel fetches. Removing the binaries stops an install from working; pointing
#    the panel at a path served by our own nginx stops the request leaving the machine at all,
#    including in the window before the server's settings arrive.
for dashboard in $DASHBOARDS; do
  found=0
  # One file per iteration rather than an unquoted expansion of several: grep may name more than
  # one bundle, and splitting its output on whitespace works only for as long as no path contains
  # any. That is a bet on a base image we do not control.
  grep -rl "$CATALOGUE_URL" "$dashboard/assets" | while IFS= read -r bundle; do
    sed -i "s#$CATALOGUE_URL#/proot-apps-removed/#g" "$bundle"
  done
  grep -rq "$CATALOGUE_URL" "$dashboard/assets" || found=1
  [ "$found" -eq 1 ] || { echo "catalogue URL still in $dashboard after rewriting"; exit 1; }
done
! grep -rq "$CATALOGUE_URL" /usr/share/selkies || { echo "catalogue URL survives"; exit 1; }
