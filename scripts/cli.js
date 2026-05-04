#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const args = process.argv.slice(2);
const command = args[0];

const help = `
council — council of AI advisors for Claude Code and Codex

Usage:
  council install [--local] [--target=claude|codex|all]
                             Install skills for selected targets
  council uninstall [--local] [--target=claude|codex|all]
                             Remove skills from selected targets
  council list                List installed skills (global/project)
  council --version           Print version

`;

function getSkillRoot(target, base) {
  if (target === "claude") return path.join(base, ".claude", "skills");
  return path.join(base, ".agents", "skills");
}

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
  const targets = ["claude", "codex"];
  let found = false;

  for (const target of targets) {
    for (const [scope, base] of [["Global", os.homedir()], ["Project", process.cwd()]]) {
      const skillRoot = getSkillRoot(target, base);
      if (!fs.existsSync(skillRoot)) continue;

      const dirs = fs.readdirSync(skillRoot, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.startsWith("council-"))
        .map((e) => e.name)
        .sort();

      if (dirs.length > 0) {
        console.log(`\n${scope} ${target} skills (${skillRoot}):\n`);
        for (const d of dirs) console.log(`  ${d}`);
        found = true;
      }
    }
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
