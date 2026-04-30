#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

const help = `
kidoncio — council of AI advisors for Claude Code

Usage:
  kidoncio install     Copy commands to ~/.claude/commands/kidoncio/
  kidoncio uninstall   Remove commands from ~/.claude/commands/kidoncio/
  kidoncio list        List installed commands
  kidoncio --version   Print version

`;

if (!command || command === "--help" || command === "-h") {
  process.stdout.write(help);
  process.exit(0);
}

if (command === "--version" || command === "-v") {
  const pkg = require("../package.json");
  console.log(pkg.version);
  process.exit(0);
}

if (command === "install") {
  require("./install.js");
  process.exit(0);
}

if (command === "uninstall") {
  require("./uninstall.js");
  process.exit(0);
}

if (command === "list") {
  const fs = require("fs");
  const path = require("path");
  const os = require("os");
  const dir = path.join(os.homedir(), ".claude", "commands", "kidoncio");
  if (!fs.existsSync(dir)) {
    console.log("kidoncio is not installed. Run: kidoncio install");
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  console.log(`\nInstalled commands (${dir}):\n`);
  for (const f of files) {
    console.log(`  /kidoncio:${path.basename(f, ".md")}`);
  }
  console.log("");
  process.exit(0);
}

console.error(`Unknown command: ${command}\n`);
process.stdout.write(help);
process.exit(1);
