#!/bin/sh

echo
echo "Initialising Shrike..."
echo

# An install that started before the proot-apps catalogue was removed from the image already has
# the binaries in its home, which is the persistent volume, so an image update never reaches them.
# Named individually because nothing else in that directory came from the catalogue.
for leftover in proot-apps proot proot-bwrap jq ncat pversion; do
  rm -f "/config/.local/bin/$leftover"
done

# The base image switches the camera on only if /dev/video0 is not there yet, and where it may not
# create a device node it leaves an empty file in its place. /dev can outlive a restart of the
# service, so that file would make every start after the first skip the camera altogether.
if [ -f /dev/video0 ]; then
  rm -f /dev/video0
fi

# always overwrite autostart in case we change it
if [ "${PIXELFLUX_WAYLAND}" = "true" ]; then
  mkdir -p /config/.config/labwc
  # remove stale backup so the base re-creates it from our /defaults/menu_wayland.xml
  rm -f /config/.config/labwc/menu.xml.bak
  cp /defaults/autostart_wayland /config/.config/labwc/autostart
  cp /defaults/menu_wayland.xml /config/.config/labwc/menu.xml
  chown -R 1000:1000 /config/.config/labwc
else
  mkdir -p /config/.config/openbox
  cp /defaults/autostart /config/.config/openbox/autostart
  chown -R 1000:1000 /config/.config/openbox
fi

exec /init
