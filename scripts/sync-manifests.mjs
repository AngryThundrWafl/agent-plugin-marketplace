#!/usr/bin/env node
// Regenerates every plugins/<name>/.claude-plugin/plugin.json from the
// canonical plugins/<name>/plugin.json, and rebuilds the root
// .claude-plugin/marketplace.json from whatever plugins exist.
//
// Usage:
//   node scripts/sync-manifests.mjs          # write the generated files
//   node scripts/sync-manifests.mjs --check  # exit 1 if anything is stale (for CI)

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGINS_DIR = join(ROOT, "plugins");
const MARKETPLACE_PATH = join(ROOT, ".claude-plugin", "marketplace.json");
const CHECK_ONLY = process.argv.includes("--check");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeIfChanged(path, content, dirty) {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (existing === content) return;
  dirty.push(path);
  if (!CHECK_ONLY) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, "utf8");
  }
}

function copyDirRecursive(src, dest, dirty) {
  if (!existsSync(src)) return;
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, dirty);
    } else {
      const content = readFileSync(srcPath, "utf8");
      writeIfChanged(destPath, content, dirty);
    }
  }
}

function main() {
  if (!existsSync(PLUGINS_DIR)) {
    console.error(`No plugins/ directory found at ${PLUGINS_DIR}`);
    process.exit(1);
  }

  const pluginDirs = readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const dirty = [];
  const marketplacePlugins = [];

  for (const name of pluginDirs) {
    const pluginDir = join(PLUGINS_DIR, name);
    const manifestPath = join(pluginDir, "plugin.json");
    if (!existsSync(manifestPath)) {
      console.warn(`skip ${name}: no plugin.json at plugin root`);
      continue;
    }

    const manifest = readJson(manifestPath);
    if (manifest.name !== name) {
      console.warn(
        `warning: plugins/${name}/plugin.json declares name "${manifest.name}" — directory name should match`
      );
    }

    // Copy the canonical manifest into the Claude Code path.
    const claudeCopyPath = join(pluginDir, ".claude-plugin", "plugin.json");
    writeIfChanged(claudeCopyPath, JSON.stringify(manifest, null, 2) + "\n", dirty);

    // Copy mcp.json to .claude-plugin/ if it exists (for Claude Code).
    const mcpSourcePath = join(pluginDir, "mcp.json");
    if (existsSync(mcpSourcePath)) {
      const mcpDestPath = join(pluginDir, ".claude-plugin", "mcp.json");
      const mcpContent = readFileSync(mcpSourcePath, "utf8");
      writeIfChanged(mcpDestPath, mcpContent, dirty);
    }

    // Copy client extension directories to .claude-plugin/ for Claude Code compatibility.
    // Per spec §8.2, client extensions live in top-level directories named by namespace.
    // We mirror them under .claude-plugin/ so Claude Code can find them.
    const knownExtensions = ["com.anthropic.claude", "com.github.copilot"];
    for (const ext of knownExtensions) {
      const extSrc = join(pluginDir, ext);
      if (existsSync(extSrc)) {
        const extDest = join(pluginDir, ".claude-plugin", ext);
        copyDirRecursive(extSrc, extDest, dirty);
      }
    }

    marketplacePlugins.push({
      name: manifest.name,
      source: `./plugins/${name}`,
      description: manifest.description ?? "",
      version: manifest.version ?? "0.0.0",
    });
  }

  const marketplace = {
    name: "agents-plugin-marketplace",
    owner: { name: "Your Name" },
    metadata: {
      description: "Harness-agnostic agent plugins for Claude Code and GitHub Copilot CLI.",
    },
    plugins: marketplacePlugins,
  };

  writeIfChanged(
    MARKETPLACE_PATH,
    JSON.stringify(marketplace, null, 2) + "\n",
    dirty
  );

  if (dirty.length > 0) {
    console.log((CHECK_ONLY ? "Stale (would write):\n" : "Wrote:\n") + dirty.map((p) => `  ${p}`).join("\n"));
    if (CHECK_ONLY) process.exit(1);
  } else {
    console.log("Everything in sync.");
  }
}

main();