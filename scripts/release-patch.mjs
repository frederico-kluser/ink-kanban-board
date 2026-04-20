#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("npm", ["version", "patch", "--no-git-tag-version", "--force"]);

const packageJsonPath = resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;

if (typeof version !== "string" || version.length === 0) {
  console.error("Could not read version from package.json");
  process.exit(1);
}

const tag = `v${version}`;
run("git", ["add", "package.json", "package-lock.json"]);
run("git", ["commit", "-m", `chore(release): ${tag}`, "package.json", "package-lock.json"]);
run("git", ["tag", tag]);
