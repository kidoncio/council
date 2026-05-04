#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

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

function uninstall(local = false, target = "all") {
  const selectedTargets = target === "all" ? TARGETS : [target];
  if (!selectedTargets.every((t) => TARGETS.includes(t))) {
    throw new Error(`invalid --target value: ${target}. Use claude, codex, or all.`);
  }

  const scope = local ? "project" : "global";
  let removedAny = false;

  for (const t of selectedTargets) {
    const skillRoot = getSkillRoot(t, local);
    if (!fs.existsSync(skillRoot)) continue;

    const skillDirs = fs.readdirSync(skillRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith("council-"));

    for (const dir of skillDirs) {
      fs.rmSync(path.join(skillRoot, dir.name), { recursive: true, force: true });
      removedAny = true;
    }

    if (skillDirs.length > 0) {
      console.log(`\n✓ council: ${skillDirs.length} skills removed from ${skillRoot} (${scope}, ${t})`);
    }
  }

  if (!removedAny) {
    console.log(`council is not installed (${scope}) — nothing to remove.`);
    return;
  }

  console.log("");
}

const local = process.argv.includes("--local");
const target = parseTargetArg();

try {
  uninstall(local, target);
} catch (err) {
  console.error("council uninstall failed:", err.message);
  process.exit(1);
}
