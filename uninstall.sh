#!/usr/bin/env bash
set -euo pipefail

DEST="${HOME}/.claude/commands/council"

if [ ! -d "${DEST}" ]; then
  echo "council is not installed — nothing to remove."
  exit 0
fi

rm -rf "${DEST}"
echo ""
echo "✓ council commands removed from ${DEST}"
echo ""
