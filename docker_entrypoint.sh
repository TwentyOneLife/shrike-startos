#!/bin/sh

echo
echo "Initialising Shrike..."
echo

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
