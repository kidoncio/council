#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const DEST_DIR = path.join(os.homedir(), ".claude", "commands", "kidoncio");

function uninstall() {
  if (!fs.existsSync(DEST_DIR)) {
    console.log("kidoncio is not installed — nothing to remove.");
    return;
  }

  fs.rmSync(DEST_DIR, { recursive: true, force: true });
  console.log(`\n✓ kidoncio: commands removed from ${DEST_DIR}\n`);
}

try {
  uninstall();
} catch (err) {
  console.error("kidoncio uninstall failed:", err.message);
  process.exit(1);
}
