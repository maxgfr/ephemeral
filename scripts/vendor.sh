#!/usr/bin/env bash
# Rebuild vendor/*.js from pinned npm versions. The site never runs npm; this
# script is only for maintainers bumping a dependency. Output is committed.
set -euo pipefail

TRYSTERO=0.25.4
QRCODE=2.0.4
ESBUILD=0.28.2

root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cd "$tmp"
npm init -y >/dev/null
npm install --no-audit --no-fund --save-exact "trystero@$TRYSTERO" "qrcode-generator@$QRCODE" "esbuild@$ESBUILD" >/dev/null

echo "export { joinRoom, selfId } from 'trystero'" > trystero-entry.js
echo "export { default } from 'qrcode-generator'" > qrcode-entry.js

banner() {
  printf '/* %s, bundled by scripts/vendor.sh. MIT licensed; see vendor/LICENSES.md. */' "$1"
}

npx esbuild trystero-entry.js --bundle --format=esm --minify --legal-comments=none \
  --banner:js="$(banner "trystero@$TRYSTERO (with @trystero-p2p/core, @trystero-p2p/nostr, @noble/secp256k1)")" \
  --outfile="$root/vendor/trystero-$TRYSTERO.js"
npx esbuild qrcode-entry.js --bundle --format=esm --minify --legal-comments=none \
  --banner:js="$(banner "qrcode-generator@$QRCODE")" \
  --outfile="$root/vendor/qrcode-generator-$QRCODE.js"

{
  echo '# Third-party licenses'
  echo
  echo 'The files in this folder are bundled from these npm packages by `scripts/vendor.sh`.'
  for pkg in trystero @trystero-p2p/core @trystero-p2p/nostr @noble/secp256k1 qrcode-generator; do
    dir="node_modules/$pkg"
    version="$(node -p "require('./$dir/package.json').version")"
    echo
    echo "## $pkg@$version"
    echo
    echo '```'
    if ls "$dir"/LICENSE* >/dev/null 2>&1; then cat "$dir"/LICENSE*; echo; else node -p "const p = require('./$dir/package.json'); 'License: ' + p.license + ' (no LICENSE file in the package)\nAuthor: ' + (p.author?.name ?? p.author) + '\nSource: ' + (p.repository?.url ?? p.homepage)"; fi
    echo '```'
  done
} > "$root/vendor/LICENSES.md"

ls -l "$root/vendor"
