# overrides to s9pk.mk must precede the include statement
# Both, so `make arches` builds both. The SDK maps arm, arm64 and aarch64 to the same target; `arm`
# is the name its own makefile lists first.
ARCHES := x86 arm
include node_modules/@start9labs/start-sdk/s9pk.mk
