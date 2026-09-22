#!/usr/bin/env bash

# get rid of 'AT-SPI: Error retrieving accessibility bus address' warnings
export NO_AT_BRIDGE=1

setterm blank 0
setterm powerdown 0

# Enable Nvidia GPU support if detected
if which nvidia-smi > /dev/null 2>&1 && ls -A /dev/dri 2>/dev/null && [ "${DISABLE_ZINK}" == "false" ]; then
  export LIBGL_KOPPER_DRI2=1
  export MESA_LOADER_DRIVER_OVERRIDE=zink
  export GALLIUM_DRIVER=zink
fi

# Start DE
exec dbus-launch --exit-with-session /usr/bin/openbox-session
