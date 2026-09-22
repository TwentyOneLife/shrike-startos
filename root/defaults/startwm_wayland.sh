#!/usr/bin/env bash

# get rid of 'AT-SPI: Error retrieving accessibility bus address' warnings
export NO_AT_BRIDGE=1

setterm blank 0
setterm powerdown 0

# Start DE
ulimit -c 0
export XCURSOR_THEME=breeze_cursors
export XCURSOR_SIZE=24
export XKB_DEFAULT_LAYOUT=us
export XKB_DEFAULT_RULES=evdev
export WAYLAND_DISPLAY=wayland-1
if [ "${SELKIES_DESKTOP}" == "true" ]; then
  labwc &
  sleep 1
  export WAYLAND_DISPLAY=wayland-0
  export DISPLAY=:0
  selkies-desktop
else
  labwc
fi
