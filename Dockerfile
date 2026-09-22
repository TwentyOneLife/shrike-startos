# Shrike, the Bitcoin Blake2b wallet, as a desktop served to a browser.
#
# Adapted from remcoros/sparrow-webtop (GPL-3.0), which does the same for Sparrow on Bitcoin.
# Three deliberate differences, all in this file and the overlay under root/:
#   - the release is verified against a key committed to this repository, by full fingerprint,
#     rather than one fetched from a key server while the image is built;
#   - the session carries the wallet and nothing else: no terminal, no file manager, no sudo;
#   - the base image is pinned by digest, because a tag moves.
#
# debiantrixie-47b9bee2-ls131, resolved 2026-09-22.
FROM ghcr.io/linuxserver/baseimage-selkies@sha256:3058b8387268c13bc4d6fc64f5b222a67cfdd6dc70836e3db9d0d5c9894224f1 AS buildstage

ARG ARCH=amd64
ARG SHRIKE_VERSION=v2.5.5-blake2b.26
ARG SHRIKE_DEBVERSION=2.5.5-26
# Published in Shrike's README and corroborated by the release author's GitHub account.
ARG SHRIKE_PGP_FINGERPRINT=A47D99B6DB0D715D40C59A2023AE8A8EA7E24E38

RUN \
  echo "**** install packages ****" && \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive \
  apt-get remove -y dunst && \
  DEBIAN_FRONTEND=noninteractive \
  apt-get install -y --no-install-recommends \
    exo-utils \
    librsvg2-common \
    python3-xdg \
    hsetroot \
    gnome-themes-extra \
    compton \
    xfce4-notifyd \
    libnotify-bin \
    xclip \
    wget \
    gnupg && \
  # Not installed, unlike upstream: a terminal, a file manager and an editor. This session is a
  # wallet, and each of those is a way to reach the wallet's files from a browser tab.
  DEBIAN_FRONTEND=noninteractive \
  apt-get remove --purge --autoremove -y \
    cmake \
    containerd.io \
    docker-ce \
    docker-ce-cli \
    docker-buildx-plugin \
    docker-compose-plugin \
    firmware-amd-graphics \
    firmware-linux-nonfree \
    firmware-misc-nonfree \
    fonts-noto-color-emoji \
    fonts-noto-core \
    fonts-noto-cjk \
    g++ \
    gcc \
    locales-all \
    make && \
  rm -rf $(ls -d /usr/share/locale/* | grep -vw /usr/share/locale/en | grep -v locale.alias) && \
  echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
  locale-gen && \
  update-locale LANG=en_US.UTF-8 && \
  DEBIAN_FRONTEND=noninteractive \
  apt-get upgrade -y && \
  echo "**** xfce tweaks ****" && \
  rm -f /etc/xdg/autostart/xscreensaver.desktop && \
  echo "Starting Shrike..." > /etc/s6-overlay/s6-rc.d/init-adduser/branding && \
  echo "**** cleanup ****" && \
  apt-get autoclean && \
  rm -rf \
    /config/.cache \
    /var/lib/apt/lists/* \
    /var/tmp/* \
    /tmp/*

# Shrike, verified before it is installed
COPY keys/privkeyio-signing-key.asc /tmp/shrike-signing-key.asc
RUN \
  echo "**** install Shrike ****" && \
  # the .deb's postinst runs xdg-desktop-menu, which needs this to exist
  mkdir -p /usr/share/desktop-directories/ && \
  # The SDK names architectures as the kernel does and Debian packages name them as Debian does,
  # so x86_64 has to become amd64 here or the download is a 404.
  case "${ARCH}" in \
    x86_64|amd64) DEB_ARCH=amd64 ;; \
    aarch64|arm64) DEB_ARCH=arm64 ;; \
    *) echo "unsupported architecture: ${ARCH}" && exit 1 ;; \
  esac && \
  cd /tmp && \
  BASE=https://github.com/privkeyio/shrike/releases/download/${SHRIKE_VERSION} && \
  wget --quiet ${BASE}/shrike_${SHRIKE_DEBVERSION}_${DEB_ARCH}.deb \
               ${BASE}/SHA256SUMS \
               ${BASE}/SHA256SUMS.asc && \
  gpg --import /tmp/shrike-signing-key.asc && \
  # The full fingerprint, not a long key id: an id is short enough to be worth forging, and a
  # matching UID string says nothing about which key signed.
  gpg --status-fd 1 --verify SHA256SUMS.asc SHA256SUMS \
      | grep -q "^\[GNUPG:\] VALIDSIG ${SHRIKE_PGP_FINGERPRINT} " || exit 1 && \
  sha256sum --check --ignore-missing SHA256SUMS || exit 1 && \
  DEBIAN_FRONTEND=noninteractive \
  apt-get install -y ./shrike_${SHRIKE_DEBVERSION}_${DEB_ARCH}.deb && \
  rm -f /tmp/shrike* /tmp/SHA256SUMS*

FROM scratch

COPY --from=buildstage / .

# restore runtime metadata inherited from the Selkies base image
ENV \
  HOME="/root" \
  LANGUAGE="en_US.UTF-8" \
  LANG="en_US.UTF-8" \
  TERM="xterm" \
  S6_CMD_WAIT_FOR_SERVICES_MAXTIME="0" \
  S6_VERBOSITY=1 \
  S6_STAGE2_HOOK=/docker-mods \
  VIRTUAL_ENV=/lsiopy \
  PATH="/lsiopy/bin:$PATH" \
  DISPLAY=:1 \
  PERL5LIB=/usr/local/bin \
  HOME=/config \
  PULSE_RUNTIME_PATH=/defaults \
  SELKIES_INTERPOSER=/usr/lib/selkies_joystick_interposer.so \
  NVIDIA_DRIVER_CAPABILITIES=all \
  DISABLE_ZINK=false \
  DISABLE_DRI3=false \
  SELKIES_ENCODER="x264enc,jpeg" \
  START_DOCKER=false \
  GTK_THEME=Adwaita:dark \
  GTK2_RC_FILES=/usr/share/themes/Adwaita-dark/gtk-2.0/gtkrc \
  SELKIES_H264_STREAMING_MODE=true \
  SELKIES_UI_SIDEBAR_SHOW_APPS=false \
  SELKIES_UI_SIDEBAR_SHOW_GAMEPADS=false \
  SELKIES_GAMEPAD_ENABLED=false \
  NO_GAMEPAD=true \
  PIXELFLUX_WAYLAND=true \
  NO_FULL=1 \
  AUTO_GPU=true \
  # A wallet, not a desktop: no shell and no privilege escalation from the browser session.
  DISABLE_SUDO=true \
  DISABLE_TERMINALS=true \
  TITLE="Shrike"

COPY /root /
COPY --chmod=755 ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
COPY --chmod=664 icon.png /usr/share/selkies/www/icon.png

EXPOSE 3000
EXPOSE 3001
VOLUME /config

ENTRYPOINT ["/usr/local/bin/docker_entrypoint.sh"]
