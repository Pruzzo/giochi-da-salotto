#!/usr/bin/env bash
# Prepara quello che serve all'APK prima della compilazione:
# 1. scarica la libreria Node.js per Android (nodejs-mobile), una volta sola;
# 2. impacchetta server, giochi e dipendenze di produzione in nodejs-project.zip.
set -euo pipefail

NODE_VERSION=18.20.4
ANDROID_DIR=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$ANDROID_DIR/.." && pwd)

LIBNODE="$ANDROID_DIR/libnode/v$NODE_VERSION"
if [ ! -f "$LIBNODE/bin/arm64-v8a/libnode.so" ]; then
  echo "Scarico nodejs-mobile v$NODE_VERSION..."
  mkdir -p "$LIBNODE"
  zip="$ANDROID_DIR/libnode/nodejs-mobile.zip"
  curl -fL -o "$zip" "https://github.com/nodejs-mobile/nodejs-mobile/releases/download/v$NODE_VERSION/nodejs-mobile-v$NODE_VERSION-android.zip"
  unzip -q -o "$zip" -d "$LIBNODE"
  rm "$zip"
fi

OUT="$ANDROID_DIR/app/build/nodejs"
STAGE="$OUT/stage/nodejs-project"
rm -rf "$OUT"
mkdir -p "$STAGE" "$OUT/assets"

cp -R "$ROOT/server" "$ROOT/public" "$ROOT/games" "$ROOT/package.json" "$ROOT/package-lock.json" "$STAGE/"
rm -rf "$STAGE"/games/*/tools

(cd "$STAGE" && npm ci --omit=dev --omit=optional --ignore-scripts --no-audit --no-fund --loglevel=error)
# Documentazione, tipi e mappe non servono a runtime.
find "$STAGE/node_modules" -type f \( -name '*.md' -o -name '*.map' -o -name '*.d.ts' -o -name '*.d.cts' -o -name '*.d.mts' \) -delete
rm -f "$STAGE/package-lock.json"

(cd "$OUT/stage" && python3 -m zipfile -c "$OUT/assets/nodejs-project.zip" nodejs-project)
echo "nodejs-project.zip: $(du -h "$OUT/assets/nodejs-project.zip" | cut -f1)"
