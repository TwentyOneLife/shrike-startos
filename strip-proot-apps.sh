#!/bin/sh
# Takes the LinuxServer base image's proot-apps catalogue out of the wallet image.
#
# The catalogue installs arbitrary desktop software into the same container that holds the wallet's
# files, and the sidebar panel driving it fetches its listing from a third party the moment it
# opens. SELKIES_UI_SIDEBAR_SHOW_APPS, which this image already sets, does not prevent either: the
# client applies that flag only once the server's settings arrive over the websocket, so the panel
# renders and is usable before then. Measured on this image, the panel is present at first paint
# and gone 500 ms later. A flag that depends on a handshake completing is not a control.
#
# Every step checks what it is about to change and fails the build when it is not there, because a
# base image update that moves any of this would otherwise turn the removal into a silent no-op.
set -eu

CONFIG_RUN=/etc/s6-overlay/s6-rc.d/init-selkies-config/run
DASHBOARDS='/usr/share/selkies/selkies-dashboard /usr/share/selkies/selkies-dashboard-wish'
CATALOGUE_URL='https://raw.githubusercontent.com/linuxserver/proot-apps/master/metadata/'

# 1. The init script copies the catalogue into the user's home on every start. Home is the
#    persistent volume, so leaving this would reinstate the binaries after they were removed.
grep -q '^# add proot-apps$' "$CONFIG_RUN"
before=$(wc -l < "$CONFIG_RUN")
awk '
  /^# add proot-apps$/                        { skip = 1 }
  skip && /chown abc:abc "\$HOME\/\.bashrc"/  { tail = 1 }
  skip && tail && /^fi$/                      { skip = 0; next }
  !skip                                       { print }
' "$CONFIG_RUN" > "$CONFIG_RUN.new"
mv "$CONFIG_RUN.new" "$CONFIG_RUN"
chmod 755 "$CONFIG_RUN"

removed=$((before - $(wc -l < "$CONFIG_RUN")))
[ "$removed" -eq 15 ] || { echo "expected to remove 15 lines, removed $removed"; exit 1; }
! grep -q proot "$CONFIG_RUN" || { echo "proot survives in $CONFIG_RUN"; exit 1; }
# The awk above deletes to the end of the file if its closing anchor ever stops matching, so prove
# that what follows the block is still there.
grep -q '^# Enable gpu encode if device detected$' "$CONFIG_RUN"

# 2. The catalogue itself, and the helper the dashboard invokes to drive it. ncat in particular has
#    no business in a wallet container.
test -x /proot-apps/proot-apps
test -x /selkies-proot
rm -rf /proot-apps /selkies-proot

# 3. The listing the panel fetches. Removing the binaries stops an install from working; pointing
#    the panel at a path served by our own nginx stops the request leaving the machine at all,
#    including in the window before the server's settings arrive.
for dashboard in $DASHBOARDS; do
  bundle=$(grep -rl "$CATALOGUE_URL" "$dashboard/assets") ||
    { echo "catalogue URL not found in $dashboard"; exit 1; }
  sed -i "s#$CATALOGUE_URL#/proot-apps-removed/#g" $bundle
done
! grep -rq "$CATALOGUE_URL" /usr/share/selkies || { echo "catalogue URL survives"; exit 1; }
