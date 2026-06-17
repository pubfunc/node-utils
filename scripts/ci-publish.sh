#!/usr/bin/env bash
set -euo pipefail

# Changesets uses pnpm publish when it detects a pnpm workspace, but npm trusted
# publishing (OIDC) only works with the npm CLI. Temporarily hide pnpm detection
# signals so `changeset publish` invokes `npm publish` instead.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LOCKFILE="$ROOT/pnpm-lock.yaml"
LOCKFILE_HIDDEN="$ROOT/pnpm-lock.yaml.hidden"
PACKAGE_JSON="$ROOT/package.json"
PACKAGE_JSON_BAK="$ROOT/package.json.bak"

cleanup() {
  if [[ -f "$LOCKFILE_HIDDEN" ]]; then
    mv "$LOCKFILE_HIDDEN" "$LOCKFILE"
  fi
  if [[ -f "$PACKAGE_JSON_BAK" ]]; then
    mv "$PACKAGE_JSON_BAK" "$PACKAGE_JSON"
  fi
}
trap cleanup EXIT

if [[ -f "$LOCKFILE" ]]; then
  mv "$LOCKFILE" "$LOCKFILE_HIDDEN"
fi

cp "$PACKAGE_JSON" "$PACKAGE_JSON_BAK"
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
  delete pkg.packageManager;
  fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
"

pnpm exec changeset publish
