#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

const help = `
council — council of AI advisors for Claude Code

Usage:
  council install     Copy commands to ~/.claude/commands/council/
  council uninstall   Remove commands from ~/.claude/commands/council/
  council list        List installed commands
  council --version   Print version

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
  const dir = path.join(os.homedir(), ".claude", "commands", "council");
  if (!fs.existsSync(dir)) {
    console.log("council is not installed. Run: council install");
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  console.log(`\nInstalled commands (${dir}):\n`);
  for (const f of files) {
    console.log(`  /council:${path.basename(f, ".md")}`);
  }
  console.log("");
  process.exit(0);
}

console.error(`Unknown command: ${command}\n`);
process.stdout.write(help);
process.exit(1);
