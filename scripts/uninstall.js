#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

function uninstall(local = false) {
  const dest = local
    ? path.join(process.cwd(), ".claude", "commands", "council")
    : path.join(os.homedir(), ".claude", "commands", "council");

  if (!fs.existsSync(dest)) {
    const scope = local ? "project" : "global";
    console.log(`council is not installed (${scope}) — nothing to remove.`);
    return;
  }

  fs.rmSync(dest, { recursive: true, force: true });
  const scope = local ? "project" : "global";
  console.log(`\n✓ council: commands removed from ${dest} (${scope})\n`);
}

const local = process.argv.includes("--local");

try {
  uninstall(local);
} catch (err) {
  console.error("council uninstall failed:", err.message);
  process.exit(1);
}
