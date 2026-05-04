#!/usr/bin/env bash
set -euo pipefail

CLAUDE_SKILLS_DEST="${HOME}/.claude/skills"
CODEX_SKILLS_DEST="${HOME}/.agents/skills"

REMOVED=0

for ROOT in "${CLAUDE_SKILLS_DEST}" "${CODEX_SKILLS_DEST}"; do
  if [ -d "${ROOT}" ]; then
    while IFS= read -r -d '' dir; do
      rm -rf "${dir}"
      echo "✓ council skill removed from ${dir}"
      REMOVED=1
    done < <(find "${ROOT}" -maxdepth 1 -type d -name 'council-*' -print0)
  fi
done

if [ "${REMOVED}" -eq 0 ]; then
  echo "council is not installed — nothing to remove."
fi

echo ""
