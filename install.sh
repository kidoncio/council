#!/usr/bin/env bash
set -euo pipefail

DEST="${HOME}/.claude/commands/kidoncio"
REPO="https://github.com/kidoncio/kidoncio-commands"
COMMANDS_URL="${REPO}/raw/main/commands"

COMMANDS=(
  architecture
  code-quality
  discuss
  execute
  plan
  product-strategy
  review
  security-engineer
  senior-engineer
)

# ── resolve source directory ──────────────────────────────────────────────────
# When run from a local clone (./install.sh), copy from the repo's commands/
# directory. When piped from curl, download from GitHub.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_SRC="${SCRIPT_DIR}/commands"

install_from_local() {
  mkdir -p "${DEST}"
  for cmd in "${COMMANDS[@]}"; do
    cp "${LOCAL_SRC}/${cmd}.md" "${DEST}/${cmd}.md"
  done
}

install_from_remote() {
  if ! command -v curl &>/dev/null; then
    echo "Error: curl is required for remote install. Clone the repo and run ./install.sh instead."
    exit 1
  fi
  mkdir -p "${DEST}"
  for cmd in "${COMMANDS[@]}"; do
    curl -fsSL "${COMMANDS_URL}/${cmd}.md" -o "${DEST}/${cmd}.md"
  done
}

# ── main ──────────────────────────────────────────────────────────────────────

echo ""
if [ -d "${LOCAL_SRC}" ]; then
  echo "Installing kidoncio commands from local clone..."
  install_from_local
else
  echo "Installing kidoncio commands from GitHub..."
  install_from_remote
fi

echo ""
echo "✓ ${#COMMANDS[@]} commands installed to ${DEST}"
echo ""
echo "Available in Claude Code:"
for cmd in "${COMMANDS[@]}"; do
  echo "  /kidoncio:${cmd}"
done
echo ""
echo "Run 'uninstall.sh' or 'kidoncio uninstall' to remove."
echo ""
