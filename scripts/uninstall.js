#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const DEST_DIR = path.join(os.homedir(), ".claude", "commands", "council");

function uninstall() {
  if (!fs.existsSync(DEST_DIR)) {
    console.log("council is not installed — nothing to remove.");
    return;
  }

  fs.rmSync(DEST_DIR, { recursive: true, force: true });
  console.log(`\n✓ council: commands removed from ${DEST_DIR}\n`);
}

try {
  uninstall();
} catch (err) {
  console.error("council uninstall failed:", err.message);
  process.exit(1);
}
