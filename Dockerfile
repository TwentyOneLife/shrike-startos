# Shrike, the Bitcoin Blake2b wallet, as a desktop served to a browser.
#
# Adapted from remcoros/sparrow-webtop (GPL-3.0), which does the same for Sparrow on Bitcoin.
# Three deliberate differences, all in this file and the overlay under root/:
#   - the release is verified against a key committed to this repository, by full fingerprint,
#     rather than one fetched from a key server while the image is built;
#   - the session carries the wallet and nothing else: no terminal, no file manager, no sudo;
#   - the base image is pinned by digest, because a tag moves.
#
# dev-5e1478e9-ls23, resolved 2026-09-23. This is the base image's development line, which builds
# Selkies from its main branch, and it is here for one reason: Selkies 1.x cannot stream to a
# browser that withholds the WebCodecs API, and Tor Browser withholds it at every security level.
# See docs/design/selkies-2.md. The release line is still 1.x; when it carries 2.x, move to it.
FROM ghcr.io/linuxserver/baseimage-selkies@sha256:e00907648e3675afff81558667084fc840de46ca2b0a7b4f45e09d89c523379a AS buildstage

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
  sha256sum --check --strict --ignore-missing SHA256SUMS || exit 1 && \
  DEBIAN_FRONTEND=noninteractive \
  apt-get install -y ./shrike_${SHRIKE_DEBVERSION}_${DEB_ARCH}.deb && \
  rm -f /tmp/shrike* /tmp/SHA256SUMS* && \
  # A wallet session has no use for a downloader or a keyring, and the verification they were
  # installed for is done. The GPG home goes with them: it holds the key this build trusted.
  rm -rf /root/.gnupg && \
  DEBIAN_FRONTEND=noninteractive \
  apt-get remove --purge --autoremove -y wget gnupg

# The base image ships a catalogue that installs arbitrary desktop software into this container.
# See the script for what it removes and why a flag was not enough.
COPY strip-proot-apps.sh /tmp/strip-proot-apps.sh
RUN sh /tmp/strip-proot-apps.sh && rm -f /tmp/strip-proot-apps.sh

FROM scratch

COPY --from=buildstage / .

# restore runtime metadata inherited from the Selkies base image
ENV \
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
  SHELL=/bin/bash \
  __GL_SYNC_TO_VBLANK=0 \
  SELKIES_INTERPOSER=/usr/lib/selkies_input_interposer.so \
  SELKIES_WEBCAM_INTERPOSER=/usr/lib/selkies_v4l2_interposer.so \
  SELKIES_ALLOWED_ORIGINS="*" \
  # Not a credential and not laxity: nginx in front of this holds the password, and Selkies' own
  # basic auth defaults to on and refuses to start the server until it is given a password of its
  # own. Leaving this out would mean two passwords for one door, or a container that will not boot.
  SELKIES_ENABLE_BASIC_AUTH=false \
  NVIDIA_DRIVER_CAPABILITIES=all \
  DISABLE_DRI3=false \
  SELKIES_ENCODER="h264enc,h265enc,vp8enc,vp9enc,av1enc,jpeg" \
  START_DOCKER=false \
  GTK_THEME=Adwaita:dark \
  GTK2_RC_FILES=/usr/share/themes/Adwaita-dark/gtk-2.0/gtkrc \
  # Upstream streams the whole screen at a fixed rate. Measured with a headless browser watching:
  # 73.7 percent of a core against 13.1 percent with this off, same machine, same client, same
  # window size. Neither costs anything once the tab is closed.
  #
  # Five times the CPU for a smoother stream is a fair trade on a desktop. It is a poor one for a
  # wallet window that is static almost all the time, on a server that is also running a node, so
  # this encodes what changes instead. Selkies 2.0 made this its own default; it stays here because
  # a squashed image inherits no environment and because the reason is worth keeping written down.
  SELKIES_VIDEO_STREAMING_MODE=false \
  # Tuned for an onion circuit, because that is how this package is meant to be reached. Left at
  # its defaults the client asked for 2800x1200 at 60 fps, which is a browser reporting a HiDPI
  # screen and taking the framerate on offer. Measured on the node against Tor Browser: the server
  # had sent 3086 frames while the browser had confirmed 957, and backpressure triggered and lifted
  # every few seconds without pause. Typing waited behind that queue.
  #
  # A framerate ceiling and CSS scaling together cut the pixels-per-second by roughly sixteen. A
  # wallet is a static window whose content changes when someone types, so the framerate buys
  # nothing here that latency does not take back. Neither value is locked: a LAN has the bandwidth
  # for more, and the side menu can raise both.
  SELKIES_FRAMERATE="8-15" \
  SELKIES_USE_CSS_SCALING=true \
  # A fixed desktop, scaled into whatever window is looking at it, rather than a desktop the window
  # reshapes. Without this the session follows the page's layout down to absurdity: with a browser's
  # developer console open, a real session was resized to 1400x200 and then 1400x100 and went black,
  # because a hundred-pixel strip is what was left for it. A wallet that rearranges itself when a
  # pane opens, and re-encodes the screen on every drag of a window edge, is not one to hand anyone.
  #
  # 1280x800 because the size has to be paid for every frame. Pinned at 1920x1080 first, on the
  # reasoning that it is what desktop software is laid out for; measured over Tor, that is 2.07
  # megapixels against 1.02, and the circuit was delivering about 2.5 frames a second while the
  # server produced 15. Typing queued behind the difference. A wallet's dialogs lay out fine at
  # 1280x800, and the pixels not sent are the ones that were making it unusable.
  SELKIES_MANUAL_RESOLUTION=true \
  SELKIES_MANUAL_WIDTH=1280 \
  SELKIES_MANUAL_HEIGHT=800 \
  # A wallet has nothing to say. Audio also fails outright in a browser that resists fingerprinting,
  # where AudioDecoder is withheld along with the rest of WebCodecs, so leaving it on means a worker
  # throwing on repeat for a feature nobody wants.
  #
  # Locked, not merely set. An unlocked setting is a default the page may override, which is
  # upstream's documented behaviour and easy to miss: with this off but unlocked, the side menu
  # still offers an "Enable Audio Stream" button that works. Locking removes it.
  SELKIES_AUDIO_ENABLED="false|locked" \
  SELKIES_MICROPHONE_ENABLED="false|locked" \
  SELKIES_UI_SIDEBAR_SHOW_APPS=false \
  SELKIES_UI_SIDEBAR_SHOW_GAMEPADS=false \
  SELKIES_GAMEPAD_ENABLED="false|locked" \
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
