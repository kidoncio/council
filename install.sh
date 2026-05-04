#!/usr/bin/env bash
set -euo pipefail

CLAUDE_SKILLS_DEST="${HOME}/.claude/skills"
CODEX_SKILLS_DEST="${HOME}/.agents/skills"
REPO="https://github.com/kidoncio/council"
SKILLS_URL="${REPO}/raw/main/skills"

SKILLS=(
  council-architecture
  council-code-quality
  council-discuss
  council-execute
  council-init
  council-plan
  council-product-strategy
  council-research
  council-review
  council-security-engineer
  council-senior-engineer
)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_SRC="${SCRIPT_DIR}/skills"

install_from_local() {
  for root in "${CLAUDE_SKILLS_DEST}" "${CODEX_SKILLS_DEST}"; do
    mkdir -p "${root}"
    for skill in "${SKILLS[@]}"; do
      mkdir -p "${root}/${skill}"
      cp "${LOCAL_SRC}/${skill}/SKILL.md" "${root}/${skill}/SKILL.md"
    done
  done
}

install_from_remote() {
  if ! command -v curl &>/dev/null; then
    echo "Error: curl is required for remote install."
    exit 1
  fi
  for root in "${CLAUDE_SKILLS_DEST}" "${CODEX_SKILLS_DEST}"; do
    mkdir -p "${root}"
    for skill in "${SKILLS[@]}"; do
      mkdir -p "${root}/${skill}"
      curl -fsSL "${SKILLS_URL}/${skill}/SKILL.md" -o "${root}/${skill}/SKILL.md"
    done
  done
}

echo ""
if [ -d "${LOCAL_SRC}" ]; then
  echo "Installing council skills from local clone..."
  install_from_local
else
  echo "Installing council skills from GitHub..."
  install_from_remote
fi

echo ""
echo "✓ ${#SKILLS[@]} skills installed to:"
echo "  - ${CLAUDE_SKILLS_DEST}"
echo "  - ${CODEX_SKILLS_DEST}"
echo ""
echo "Available skills:"
for skill in "${SKILLS[@]}"; do
  echo "  ${skill}"
done
echo ""
echo "Run 'uninstall.sh' or 'council uninstall' to remove." 
echo ""
