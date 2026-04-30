#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const DEST_DIR = path.join(os.homedir(), ".claude", "commands", "kidoncio");
const SRC_DIR = path.join(__dirname, "..", "commands");

function install() {
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(DEST_DIR, file);
    fs.copyFileSync(src, dest);
  }

  console.log(`\n✓ kidoncio: ${files.length} commands installed to ${DEST_DIR}\n`);
  console.log("Available commands in Claude Code:");
  for (const file of files) {
    const name = path.basename(file, ".md");
    console.log(`  /kidoncio:${name}`);
  }
  console.log("");
}

try {
  install();
} catch (err) {
  console.error("kidoncio install failed:", err.message);
  process.exit(1);
}
