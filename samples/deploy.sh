#!/usr/bin/env bash
# Package the theme and drop the .vsix next to the repo. Usage: ./deploy.sh [version]
set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version")}"
OUT_DIR="${OUT_DIR:-dist}"
readonly VERSION OUT_DIR

log() { printf '\e[2m%s\e[0m %s\n' "$(date +%H:%M:%S)" "$*"; }

if [[ ! -f package.json ]]; then
  echo "run from the theme folder" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
for f in themes/*.json; do
  log "checking $f"
  node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$f"
done

count=$(ls themes | wc -l | tr -d ' ')
log "packaging v${VERSION} (${count} theme files)"
npx @vscode/vsce package --out "${OUT_DIR}/theme-${VERSION}.vsix" 2>&1 | tail -n 1

cat <<MSG
done: ${OUT_DIR}/theme-${VERSION}.vsix
install: cursor --install-extension ${OUT_DIR}/theme-${VERSION}.vsix
MSG
