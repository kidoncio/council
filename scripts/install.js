#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const SRC_DIR = path.join(__dirname, "..", "commands");

function install(local = false) {
  const dest = local
    ? path.join(process.cwd(), ".claude", "commands", "council")
    : path.join(os.homedir(), ".claude", "commands", "council");

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    fs.copyFileSync(path.join(SRC_DIR, file), path.join(dest, file));
  }

  const scope = local ? "project" : "global";
  console.log(`\n✓ council: ${files.length} commands installed to ${dest} (${scope})\n`);
  console.log("Available commands in Claude Code:");
  for (const file of files) {
    console.log(`  /council:${path.basename(file, ".md")}`);
  }
  console.log("");
}

const local = process.argv.includes("--local");

// postinstall fires on both `npm install -g` and `npx`.
// Only run automatically on a true global install — skip for npx and local installs.
if (require.main !== module) {
  const isGlobal = process.env.npm_config_global === "true";
  if (!isGlobal) process.exit(0);
}

try {
  install(local);
} catch (err) {
  console.error("council install failed:", err.message);
  process.exit(1);
}
