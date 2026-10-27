#!/usr/bin/env node
// Scaffolds a new plugin under plugins/<name>/ with the standard layout.
// Usage: node scripts/new-plugin.mjs my-new-plugin

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];

// Per spec §5.5: 1-64 chars, lowercase alphanumeric/hyphen/period, no leading/trailing hyphen/period, no consecutive -- or ..
const nameRegex = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
if (!name || !nameRegex.test(name) || name.includes("--") || name.includes("..") || name.length > 64) {
  console.error("Usage: node scripts/new-plugin.mjs <kebab-case-name>");
  console.error("Name must: 1-64 chars, lowercase alphanumeric/hyphen/period, no leading/trailing hyphen/period, no consecutive -- or ..");
  process.exit(1);
}

const pluginDir = join(ROOT, "plugins", name);
if (existsSync(pluginDir)) {
  console.error(`plugins/${name} already exists`);
  process.exit(1);
}

const dirs = ["agents", "skills", "commands", "hooks"];
for (const d of dirs) mkdirSync(join(pluginDir, d), { recursive: true });

writeFileSync(
  join(pluginDir, "plugin.json"),
  JSON.stringify(
    {
      "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
      name,
      version: "0.1.0",
      description: "TODO: describe what this plugin does.",
      author: { name: "Your Name" },
      keywords: [],
    },
    null,
    2
  ) + "\n"
);

writeFileSync(
  join(pluginDir, "mcp.json"),
  JSON.stringify(
    {
      "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
      mcpServers: {},
    },
    null,
    2
  ) + "\n"
);

writeFileSync(
  join(pluginDir, "hooks", "hooks.json"),
  JSON.stringify({ hooks: {} }, null, 2) + "\n"
);

writeFileSync(
  join(pluginDir, "README.md"),
  `# ${name}\n\nTODO: describe this plugin, what agents/skills/commands it ships, and any setup steps.\n`
);

console.log(`Created plugins/${name}/`);
console.log("Next: add agents/skills/commands, then run `node scripts/sync-manifests.mjs`.");