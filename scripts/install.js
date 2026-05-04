#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const SKILLS_DIR = path.join(__dirname, "..", "skills");
const TARGETS = ["claude", "codex"];

function parseTargetArg() {
  const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
  if (!targetArg) return "all";
  return targetArg.split("=")[1];
}

function getSkillRoot(target, local) {
  const base = local ? process.cwd() : os.homedir();
  if (target === "claude") return path.join(base, ".claude", "skills");
  return path.join(base, ".agents", "skills");
}

function install(local = false, target = "all") {
  const selectedTargets = target === "all" ? TARGETS : [target];
  if (!selectedTargets.every((t) => TARGETS.includes(t))) {
    throw new Error(`invalid --target value: ${target}. Use claude, codex, or all.`);
  }

  const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("council-"))
    .map((e) => e.name)
    .sort();

  for (const t of selectedTargets) {
    const skillRoot = getSkillRoot(t, local);
    fs.mkdirSync(skillRoot, { recursive: true });

    for (const skillDirName of skillDirs) {
      const srcSkillDir = path.join(SKILLS_DIR, skillDirName);
      const destSkillDir = path.join(skillRoot, skillDirName);
      fs.mkdirSync(destSkillDir, { recursive: true });
      fs.copyFileSync(path.join(srcSkillDir, "SKILL.md"), path.join(destSkillDir, "SKILL.md"));
    }

    const scope = local ? "project" : "global";
    console.log(`\n✓ council: ${skillDirs.length} skills installed to ${skillRoot} (${scope}, ${t})`);
  }

  console.log("\nAvailable skills:");
  for (const skillDirName of skillDirs) console.log(`  ${skillDirName}`);
  console.log("");
}

const local = process.argv.includes("--local");
const target = parseTargetArg();
const isPostinstall = process.env.npm_lifecycle_event === "postinstall";
if (isPostinstall && !local) {
  if (process.env.npm_config_global !== "true") process.exit(0);
}

try {
  install(local, target);
} catch (err) {
  console.error("council install failed:", err.message);
  process.exit(1);
}
