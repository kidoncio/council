#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const args = process.argv.slice(2);
const command = args[0];
const local = args.includes("--local");

const help = `
council — council of AI advisors for Claude Code

Usage:
  council install [--local]   Copy commands to ~/.claude/ (global) or .claude/ (project)
  council uninstall [--local] Remove commands from the global or project install
  council list                List installed commands (global and project)
  council --version           Print version

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
  const globalDir = path.join(os.homedir(), ".claude", "commands", "council");
  const localDir = path.join(process.cwd(), ".claude", "commands", "council");

  let found = false;

  if (fs.existsSync(globalDir)) {
    const files = fs.readdirSync(globalDir).filter((f) => f.endsWith(".md"));
    console.log(`\nGlobal (${globalDir}):\n`);
    for (const f of files) console.log(`  /council:${path.basename(f, ".md")}`);
    found = true;
  }

  if (fs.existsSync(localDir)) {
    const files = fs.readdirSync(localDir).filter((f) => f.endsWith(".md"));
    console.log(`\nProject (${localDir}):\n`);
    for (const f of files) console.log(`  /council:${path.basename(f, ".md")}`);
    found = true;
  }

  if (!found) {
    console.log("council is not installed. Run: council install");
    process.exit(1);
  }

  console.log("");
  process.exit(0);
}

console.error(`Unknown command: ${command}\n`);
process.stdout.write(help);
process.exit(1);
