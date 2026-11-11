#!/bin/sh
set -eu
if ! command -v clang-18 >/dev/null 2>&1 || ! command -v wasm-ld-18 >/dev/null 2>&1; then
  if [ "$(id -u)" != 0 ]; then
    echo 'Install clang-18 and lld-18, then rerun setup-core.sh.' >&2
    exit 1
  fi
  apt-get update -qq
  apt-get install -y clang-18 lld-18
fi
cd "$(dirname "$0")/.."
node scripts/build-core.mjs
