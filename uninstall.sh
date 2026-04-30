#!/usr/bin/env bash
set -euo pipefail

DEST="${HOME}/.claude/commands/kidoncio"

if [ ! -d "${DEST}" ]; then
  echo "kidoncio is not installed — nothing to remove."
  exit 0
fi

rm -rf "${DEST}"
echo ""
echo "✓ kidoncio commands removed from ${DEST}"
echo ""
