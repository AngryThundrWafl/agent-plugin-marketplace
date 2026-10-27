#!/usr/bin/env node
// Checks every plugin manifest for required fields and every
// agents/skills/commands markdown file for YAML frontmatter.
// Validates plugin.json and mcp.json against the official Agent Plugins schemas.
// Run after sync-manifests.mjs. Exits non-zero on any failure.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import addMetaSchema2020Module from "ajv/dist/refs/json-schema-2020-12/index.js";
const addMetaSchema2020 = addMetaSchema2020Module.default;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGINS_DIR = join(ROOT, "plugins");
const REQUIRED_FIELDS = ["$schema", "name", "version", "description", "author"];

// Official Agent Plugins 1.0.0 schemas using draft-2020-12
// The negative lookahead pattern for plugin names requires proper escaping in JS strings
const PLUGIN_SCHEMA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "title": "Agent Plugins Manifest",
  "type": "object",
  "properties": {
    "$schema": {
      "const": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
      "description": "Canonical identifier of the plugin manifest schema for the Agent Plugins version targeted by this document."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "pattern": "^(?!.*(?:--|\\\\.\\\\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$",
      "description": "Human-readable plugin name."
    },
    "version": { "type": "string" },
    "description": { "type": "string" },
    "author": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" },
        "url": { "type": "string" }
      },
      "additionalProperties": false
    },
    "homepage": { "type": "string" },
    "repository": { "type": "string" },
    "license": { "type": "string" },
    "keywords": {
      "type": "array",
      "items": { "type": "string" }
    },
    "extensions": {
      "type": "object",
      "description": "Client-specific manifest data keyed by reverse-domain extension namespace.",
      "additionalProperties": { "type": "object" }
    }
  },
  "required": ["$schema", "name"],
  "additionalProperties": false
};

const MCP_SCHEMA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "title": "Agent Plugins MCP Configuration",
  "description": "Machine-readable schema for mcp.json in Agent Plugins 1.0.0.",
  "type": "object",
  "properties": {
    "$schema": {
      "const": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
      "description": "Canonical identifier of the MCP configuration schema for the Agent Plugins version targeted by this document."
    },
    "mcpServers": {
      "type": "object",
      "additionalProperties": { "$ref": "#/$defs/server" }
    }
  },
  "required": ["$schema", "mcpServers"],
  "additionalProperties": false,
  "$defs": {
    "server": {
      "title": "MCP server",
      "oneOf": [
        { "$ref": "#/$defs/stdioServer" },
        { "$ref": "#/$defs/streamableHttpServer" },
        { "$ref": "#/$defs/sseServer" }
      ]
    },
    "stdioServer": {
      "title": "stdio MCP server",
      "type": "object",
      "properties": {
        "type": { "const": "stdio" },
        "command": { "type": "string", "minLength": 1, "description": "Executable token." },
        "args": { "type": "array", "items": { "type": "string" } },
        "env": {
          "type": "object",
          "propertyNames": { "not": { "enum": ["PLUGIN_ROOT", "PLUGIN_DATA"] } },
          "additionalProperties": { "type": "string" }
        },
        "cwd": {
          "type": "string",
          "pattern": "^(?:\\.\\/|\\$\\{PLUGIN_ROOT\\}(?:/|$)|\\$\\{PLUGIN_DATA\\}(?:/|$))",
          "description": "Plugin-relative, PLUGIN_ROOT-rooted, or PLUGIN_DATA-rooted working directory."
        }
      },
      "required": ["type", "command"],
      "additionalProperties": false
    },
    "streamableHttpServer": {
      "title": "Streamable HTTP MCP server",
      "type": "object",
      "properties": {
        "type": { "const": "streamable-http" },
        "url": { "type": "string", "minLength": 1, "description": "MCP endpoint URL." },
        "headers": { "$ref": "#/$defs/headers" }
      },
      "required": ["type", "url"],
      "additionalProperties": false
    },
    "sseServer": {
      "title": "Legacy HTTP+SSE MCP server",
      "type": "object",
      "properties": {
        "type": { "const": "sse" },
        "url": { "type": "string", "minLength": 1, "description": "MCP endpoint URL." },
        "headers": { "$ref": "#/$defs/headers" }
      },
      "required": ["type", "url"],
      "additionalProperties": false
    },
    "headers": {
      "title": "HTTP headers",
      "type": "object",
      "additionalProperties": { "type": "string" }
    }
  }
};

// Configure AJV with draft-2020-12 meta-schema support
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
addMetaSchema2020.call(ajv);

const validatePlugin = ajv.compile(PLUGIN_SCHEMA);
const validateMcp = ajv.compile(MCP_SCHEMA);

let errors = 0;

function fail(msg) {
  console.error(`✗ ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`⚠ ${msg}`);
}

function hasFrontmatter(path) {
  const text = readFileSync(path, "utf8");
  return text.startsWith("---\n") && text.indexOf("\n---", 4) !== -1;
}

function walkMarkdown(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function validateJsonSchema(validate, data, path) {
  if (!validate(data)) {
    for (const err of validate.errors || []) {
      const loc = err.instancePath || err.schemaPath;
      fail(`${path}: ${err.message} (${loc})`);
    }
    return false;
  }
  return true;
}

function validatePluginName(name, path) {
  // Per spec §5.5: 1-64 chars, lowercase alphanumeric/hyphen/period, no leading/trailing hyphen/period, no consecutive hyphens/periods
  if (name.length < 1 || name.length > 64) {
    fail(`${path}: plugin name must be 1-64 characters (got ${name.length})`);
    return false;
  }
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(name)) {
    fail(`${path}: plugin name must start and end with alphanumeric, contain only lowercase alphanumeric, hyphen, period`);
    return false;
  }
  if (name.includes("--") || name.includes("..")) {
    fail(`${path}: plugin name must not contain consecutive hyphens or periods`);
    return false;
  }
  return true;
}

function validateSchemaUrl(schemaUrl, expected, path) {
  if (schemaUrl !== expected) {
    fail(`${path}: "$schema" must be "${expected}" (got "${schemaUrl}")`);
    return false;
  }
  return true;
}

if (!existsSync(PLUGINS_DIR)) {
  fail(`no plugins/ directory at ${PLUGINS_DIR}`);
} else {
  const pluginDirs = readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (pluginDirs.length === 0) fail("plugins/ directory is empty");

  for (const name of pluginDirs) {
    const pluginDir = join(PLUGINS_DIR, name);
    const manifestPath = join(pluginDir, "plugin.json");

    if (!existsSync(manifestPath)) {
      fail(`plugins/${name}: missing plugin.json at plugin root (required by Copilot CLI)`);
      continue;
    }

    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (e) {
      fail(`plugins/${name}/plugin.json: invalid JSON (${e.message})`);
      continue;
    }

    // Validate $schema URL
    validateSchemaUrl(manifest.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", `plugins/${name}/plugin.json`);

    // Validate against official schema
    validateJsonSchema(validatePlugin, manifest, `plugins/${name}/plugin.json`);

    // Validate plugin name per spec §5.5
    if (manifest.name) {
      validatePluginName(manifest.name, `plugins/${name}/plugin.json`);
    }

    // Additional required field checks (beyond schema)
    for (const field of REQUIRED_FIELDS) {
      if (!manifest[field]) fail(`plugins/${name}/plugin.json: missing "${field}"`);
    }
    if (manifest.name && manifest.name !== name) {
      fail(`plugins/${name}/plugin.json: "name" (${manifest.name}) must match directory name`);
    }

    // Check for client extensions (Claude Code and Copilot CLI)
    if (manifest.extensions) {
      if (manifest.extensions["com.anthropic.claude"]) {
        console.log(`  ℹ plugins/${name}: has Claude Code extension`);
      }
      if (manifest.extensions["com.github.copilot"]) {
        console.log(`  ℹ plugins/${name}: has GitHub Copilot extension`);
      }
    }

    const claudeCopy = join(pluginDir, ".claude-plugin", "plugin.json");
    if (!existsSync(claudeCopy)) {
      fail(`plugins/${name}: missing .claude-plugin/plugin.json — run scripts/sync-manifests.mjs`);
    }

    for (const sub of ["agents", "skills", "commands"]) {
      for (const file of walkMarkdown(join(pluginDir, sub))) {
        if (!hasFrontmatter(file)) {
          fail(`${file.replace(ROOT + "/", "")}: missing YAML frontmatter`);
        }
      }
    }

    const hooksPath = join(pluginDir, "hooks", "hooks.json");
    if (existsSync(hooksPath)) {
      try {
        JSON.parse(readFileSync(hooksPath, "utf8"));
      } catch (e) {
        fail(`plugins/${name}/hooks/hooks.json: invalid JSON (${e.message})`);
      }
    }

    // Validate mcp.json if present
    const mcpPath = join(pluginDir, "mcp.json");
    if (existsSync(mcpPath)) {
      let mcpConfig;
      try {
        mcpConfig = JSON.parse(readFileSync(mcpPath, "utf8"));
      } catch (e) {
        fail(`plugins/${name}/mcp.json: invalid JSON (${e.message})`);
        mcpConfig = null;
      }
      if (mcpConfig) {
        // Validate $schema URL
        validateSchemaUrl(mcpConfig.$schema, "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json", `plugins/${name}/mcp.json`);
        validateJsonSchema(validateMcp, mcpConfig, `plugins/${name}/mcp.json`);
      }

      // Also validate the .claude-plugin/mcp.json copy if it exists
      const claudeMcpPath = join(pluginDir, ".claude-plugin", "mcp.json");
      if (existsSync(claudeMcpPath)) {
        let claudeMcp;
        try {
          claudeMcp = JSON.parse(readFileSync(claudeMcpPath, "utf8"));
        } catch (e) {
          fail(`plugins/${name}/.claude-plugin/mcp.json: invalid JSON (${e.message})`);
          claudeMcp = null;
        }
        if (claudeMcp) {
          validateJsonSchema(validateMcp, claudeMcp, `plugins/${name}/.claude-plugin/mcp.json`);
        }
      }
    }
  }
}

const marketplacePath = join(ROOT, ".claude-plugin", "marketplace.json");
if (!existsSync(marketplacePath)) {
  fail("missing .claude-plugin/marketplace.json — run scripts/sync-manifests.mjs");
} else {
  try {
    JSON.parse(readFileSync(marketplacePath, "utf8"));
  } catch (e) {
    fail(`.claude-plugin/marketplace.json: invalid JSON (${e.message})`);
  }
}

if (errors > 0) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
} else {
  console.log("All plugins valid.");
}