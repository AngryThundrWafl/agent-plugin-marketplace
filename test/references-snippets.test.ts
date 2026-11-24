import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  validateAntigravityManifest,
  validateAntigravityMcpConfig,
  validateMarketplace,
  validateMcpJson,
  validatePlugin,
  validateRepo,
  validateSkillDir,
} from "../src/validator.js";

const REPO_ROOT = process.cwd();
const SCHEMAS_DIR = path.resolve(REPO_ROOT, "schemas");
const REFERENCES_DIR = path.resolve(
  REPO_ROOT,
  "plugins",
  "build-an-agent-plugin",
  "skills",
  "build-an-agent-plugin",
  "references",
);

interface ReferenceSnippet {
  file: string;
  line: number;
  tag: string;
  content: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractValidatedSnippets(referencesDir: string): ReferenceSnippet[] {
  const mdFiles = fs
    .readdirSync(referencesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  const snippets: ReferenceSnippet[] = [];

  for (const fileName of mdFiles) {
    const filePath = path.join(referencesDir, fileName);
    const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
    const lines = raw.split("\n");

    let activeFenceChar: string | undefined;
    let activeFenceLength = 0;
    let activeTag: string | undefined;
    let activeStartLine = 0;
    let buffer: string[] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? "";

      if (activeFenceChar === undefined) {
        const openMatch = /^(`{3,}|~{3,})([^\n]*)$/.exec(line);
        if (!openMatch) {
          continue;
        }
        const fence = openMatch[1];
        const info = (openMatch[2] ?? "").trim();
        if (!fence) {
          continue;
        }
        activeFenceChar = fence[0];
        activeFenceLength = fence.length;
        const tokens = info.split(/\s+/).filter((t) => t.length > 0);
        activeTag = tokens.find((token) => token.startsWith("validate:"));
        activeStartLine = i + 1;
        buffer = [];
      } else {
        const closePattern = new RegExp(
          `^${activeFenceChar}{${activeFenceLength},}\\s*$`,
        );
        if (closePattern.test(line)) {
          if (activeTag !== undefined) {
            snippets.push({
              file: fileName,
              line: activeStartLine,
              tag: activeTag,
              content: `${buffer.join("\n")}\n`,
            });
          }
          activeFenceChar = undefined;
          activeFenceLength = 0;
          activeTag = undefined;
          buffer = [];
        } else {
          buffer.push(line);
        }
      }
    }
  }

  return snippets;
}

const snippets = extractValidatedSnippets(REFERENCES_DIR);
const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "agent-plugin-ref-snippets-"),
);

afterAll(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("build-an-agent-plugin reference snippets", () => {
  it("discovers at least 5 validate:* fenced blocks covering all expected config types", () => {
    expect(snippets.length).toBeGreaterThanOrEqual(5);

    const tags = snippets.map((snippet) => snippet.tag);
    expect(tags).toContain("validate:plugin.json");
    expect(tags).toContain("validate:antigravity-plugin.json");
    expect(tags).toContain("validate:mcp.json");
    expect(tags).toContain("validate:mcp_config.json");
    expect(tags).toContain("validate:marketplace.json");
    expect(tags.some((tag) => tag.startsWith("validate:skill:"))).toBe(true);
  });

  for (let index = 0; index < snippets.length; index += 1) {
    const snippet = snippets[index];
    if (!snippet) {
      continue;
    }

    it(`validates ${snippet.file}:${snippet.line} (${snippet.tag})`, () => {
      const workDir = path.join(tempRoot, `snippet-${index}`);
      fs.mkdirSync(workDir, { recursive: true });

      if (snippet.tag === "validate:plugin.json") {
        const pluginDir = path.join(workDir, "plugin");
        fs.mkdirSync(pluginDir, { recursive: true });
        fs.writeFileSync(
          path.join(pluginDir, "plugin.json"),
          snippet.content,
          "utf8",
        );

        const result = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });
        expect(result.ok).toBe(true);
        expect(result.errors).toEqual([]);
        return;
      }

      if (snippet.tag === "validate:antigravity-plugin.json") {
        const agDir = path.join(workDir, ".antigravity-plugin");
        fs.mkdirSync(agDir, { recursive: true });
        const manifestPath = path.join(agDir, "plugin.json");
        fs.writeFileSync(manifestPath, snippet.content, "utf8");

        const result = validateAntigravityManifest(manifestPath, {
          schemasDir: SCHEMAS_DIR,
        });
        expect(result.ok).toBe(true);
        expect(result.errors).toEqual([]);
        return;
      }

      if (snippet.tag === "validate:mcp.json") {
        const pluginDir = path.join(workDir, "plugin");
        fs.mkdirSync(pluginDir, { recursive: true });
        const mcpPath = path.join(pluginDir, "mcp.json");
        fs.writeFileSync(mcpPath, snippet.content, "utf8");

        const parsed: unknown = JSON.parse(snippet.content);
        if (isPlainObject(parsed) && isPlainObject(parsed.mcpServers)) {
          for (const server of Object.values(parsed.mcpServers)) {
            if (!isPlainObject(server)) {
              continue;
            }
            if (
              typeof server.command === "string" &&
              server.command.startsWith("./") &&
              !server.command.includes("..")
            ) {
              const commandPath = path.resolve(pluginDir, server.command);
              fs.mkdirSync(path.dirname(commandPath), { recursive: true });
              fs.writeFileSync(commandPath, "#!/usr/bin/env sh\n", "utf8");
            }
            if (
              typeof server.cwd === "string" &&
              server.cwd.startsWith("./") &&
              server.cwd !== "./" &&
              !server.cwd.includes("..")
            ) {
              fs.mkdirSync(path.resolve(pluginDir, server.cwd), {
                recursive: true,
              });
            }
          }
        }

        const result = validateMcpJson(
          mcpPath,
          pluginDir,
          "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
          { schemasDir: SCHEMAS_DIR },
        );
        expect(result.ok).toBe(true);
        expect(result.errors).toEqual([]);
        return;
      }

      if (snippet.tag === "validate:mcp_config.json") {
        const pluginDir = path.join(workDir, "plugin");
        fs.mkdirSync(pluginDir, { recursive: true });
        const mcpConfigPath = path.join(pluginDir, "mcp_config.json");
        fs.writeFileSync(mcpConfigPath, snippet.content, "utf8");

        const result = validateAntigravityMcpConfig(mcpConfigPath);
        expect(result.ok).toBe(true);
        expect(result.errors).toEqual([]);
        return;
      }

      if (snippet.tag === "validate:marketplace.json") {
        const repoDir = path.join(workDir, "repo");
        const catalogDir = path.join(repoDir, ".claude-plugin");
        fs.mkdirSync(catalogDir, { recursive: true });
        fs.writeFileSync(
          path.join(catalogDir, "marketplace.json"),
          snippet.content,
          "utf8",
        );

        const parsed: unknown = JSON.parse(snippet.content);
        if (isPlainObject(parsed) && Array.isArray(parsed.plugins)) {
          for (const entry of parsed.plugins) {
            if (
              isPlainObject(entry) &&
              typeof entry.source === "string" &&
              (entry.source === "." || entry.source.startsWith("./")) &&
              !entry.source.includes("..")
            ) {
              fs.mkdirSync(path.resolve(repoDir, entry.source), {
                recursive: true,
              });
            }
          }
        }

        const result = validateMarketplace(repoDir, {
          schemasDir: SCHEMAS_DIR,
        });
        expect(result.ok).toBe(true);
        expect(result.errors).toEqual([]);
        return;
      }

      if (snippet.tag.startsWith("validate:skill:")) {
        const skillName = snippet.tag.slice("validate:skill:".length);
        expect(skillName.length).toBeGreaterThan(0);

        const skillDir = path.join(workDir, "skills", skillName);
        fs.mkdirSync(skillDir, { recursive: true });
        fs.writeFileSync(
          path.join(skillDir, "SKILL.md"),
          snippet.content,
          "utf8",
        );

        const result = validateSkillDir(skillDir, workDir);
        expect(result.ok).toBe(true);
        expect(result.errors).toEqual([]);
        return;
      }

      throw new Error(
        `Unsupported validation tag "${snippet.tag}" in ${snippet.file}:${snippet.line}`,
      );
    });
  }

  it("validates the live repository via validateRepo(process.cwd())", () => {
    const result = validateRepo(process.cwd(), { schemasDir: SCHEMAS_DIR });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
