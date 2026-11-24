import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  checkSecretsInObject,
  validateAntigravityManifest,
  validateMarketplace,
  validatePlugin,
  validateRepo,
  validateSkillDir,
  type ValidationIssue,
  type ValidationResult,
} from "../src/validator.js";

const SCHEMAS_DIR = path.resolve(process.cwd(), "schemas");
const FIXTURES_DIR = path.resolve(process.cwd(), "test", "fixtures");
const VALID_REPO_DIR = path.join(FIXTURES_DIR, "valid", "marketplace-repo");
const VALID_PLUGIN_DIR = path.join(VALID_REPO_DIR, "plugins", "sample-plugin");
const INVALID_DIR = path.join(FIXTURES_DIR, "invalid");

function expectValidIssueShapes(
  issues: ValidationIssue[],
  expectedSeverity: "error" | "warning",
): void {
  for (const issue of issues) {
    expect(issue.severity).toBe(expectedSeverity);
    expect(typeof issue.code).toBe("string");
    expect(issue.code.length).toBeGreaterThan(0);
    expect(typeof issue.file).toBe("string");
    expect(issue.file.length).toBeGreaterThan(0);
    expect(typeof issue.message).toBe("string");
    expect(issue.message.length).toBeGreaterThan(0);
  }
}

function expectValidResultShape(result: ValidationResult): void {
  expect(typeof result.ok).toBe("boolean");
  expect(Array.isArray(result.errors)).toBe(true);
  expect(Array.isArray(result.warnings)).toBe(true);
  expect(result.ok).toBe(result.errors.length === 0);
  expectValidIssueShapes(result.errors, "error");
  expectValidIssueShapes(result.warnings, "warning");
}

function hasIssueMatching(issues: ValidationIssue[], pattern: RegExp): boolean {
  return issues.some((issue) =>
    pattern.test(`${issue.code} ${issue.file} ${issue.message}`),
  );
}

describe("valid marketplace repo fixture", () => {
  it("validates the complete repository via validateRepo", () => {
    const result = validateRepo(VALID_REPO_DIR, { schemasDir: SCHEMAS_DIR });
    expectValidResultShape(result);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates the marketplace catalog via validateMarketplace", () => {
    const result = validateMarketplace(VALID_REPO_DIR, {
      schemasDir: SCHEMAS_DIR,
    });
    expectValidResultShape(result);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates the sample plugin including manifests, mcp.json, mcp_config.json, and skills", () => {
    const result = validatePlugin(VALID_PLUGIN_DIR, {
      schemasDir: SCHEMAS_DIR,
    });
    expectValidResultShape(result);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates the sample skill directory directly via validateSkillDir", () => {
    const skillDir = path.join(VALID_PLUGIN_DIR, "skills", "sample-skill");
    const result = validateSkillDir(skillDir, VALID_PLUGIN_DIR);
    expectValidResultShape(result);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates the Antigravity plugin manifest directly via validateAntigravityManifest", () => {
    const manifestPath = path.join(
      VALID_PLUGIN_DIR,
      ".antigravity-plugin",
      "plugin.json",
    );
    const result = validateAntigravityManifest(manifestPath, {
      schemasDir: SCHEMAS_DIR,
    });
    expectValidResultShape(result);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("invalid fixtures", () => {
  it("rejects bad-plugin-manifest (invalid name and non-canonical $schema)", () => {
    const pluginDir = path.join(INVALID_DIR, "bad-plugin-manifest");
    const result = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });

    expectValidResultShape(result);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(hasIssueMatching(result.errors, /plugin\.json/i)).toBe(true);
    expect(hasIssueMatching(result.errors, /name|Bad--Plugin/i)).toBe(true);
    expect(hasIssueMatching(result.errors, /\$schema|schema/i)).toBe(true);
  });

  it("rejects bad-mcp-version-mismatch (plugin.json 1.0.0 vs mcp.json 1.1.0)", () => {
    const pluginDir = path.join(INVALID_DIR, "bad-mcp-version-mismatch");
    const result = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });

    expectValidResultShape(result);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(hasIssueMatching(result.errors, /mcp\.json/i)).toBe(true);
    expect(
      hasIssueMatching(result.errors, /\$schema|schema|version|1\.1\.0|mismatch/i),
    ).toBe(true);
  });

  it("rejects bad-mcp-command-and-path (multi-token command, escaping command, escaping cwd, non-./ cwd)", () => {
    const pluginDir = path.join(INVALID_DIR, "bad-mcp-command-and-path");
    const result = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });

    expectValidResultShape(result);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
    expect(hasIssueMatching(result.errors, /mcp\.json/i)).toBe(true);
    expect(
      hasIssueMatching(
        result.errors,
        /multi-token|single|token|whitespace|space|command/i,
      ),
    ).toBe(true);
    expect(
      hasIssueMatching(
        result.errors,
        /escaping-command|\.\.\/outside|escape|relative|command/i,
      ),
    ).toBe(true);
    expect(
      hasIssueMatching(
        result.errors,
        /escaping-cwd|outside|escape|contain|cwd/i,
      ),
    ).toBe(true);
    expect(
      hasIssueMatching(result.errors, /bare-cwd|cwd|pattern|\.\//i),
    ).toBe(true);
  });

  it("rejects bad-mcp-reserved-env (PLUGIN_ROOT and PLUGIN_DATA in stdio env)", () => {
    const pluginDir = path.join(INVALID_DIR, "bad-mcp-reserved-env");
    const result = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });

    expectValidResultShape(result);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(hasIssueMatching(result.errors, /mcp\.json/i)).toBe(true);
    expect(
      hasIssueMatching(
        result.errors,
        /PLUGIN_ROOT|PLUGIN_DATA|reserved|property name|env/i,
      ),
    ).toBe(true);
  });

  it("rejects bad-mcp-remote (non-loopback HTTP URL and duplicate case-insensitive headers)", () => {
    const pluginDir = path.join(INVALID_DIR, "bad-mcp-remote");
    const result = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });

    expectValidResultShape(result);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(hasIssueMatching(result.errors, /mcp\.json/i)).toBe(true);
    expect(
      hasIssueMatching(result.errors, /https|loopback|http:\/\/example\.com/i),
    ).toBe(true);
    expect(
      hasIssueMatching(result.errors, /x-trace|duplicate|header/i),
    ).toBe(true);
  });

  it("rejects bad-secrets in both mcp.json and mcp_config.json", () => {
    const pluginDir = path.join(INVALID_DIR, "bad-secrets");
    const result = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });

    expectValidResultShape(result);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(hasIssueMatching(result.errors, /mcp\.json/i)).toBe(true);
    expect(hasIssueMatching(result.errors, /mcp_config\.json/i)).toBe(true);
    expect(hasIssueMatching(result.errors, /API_KEY/i)).toBe(true);
    expect(hasIssueMatching(result.errors, /X-Auth-Token/i)).toBe(true);
    expect(hasIssueMatching(result.errors, /SERVICE_SECRET/i)).toBe(true);
  });

  it("rejects bad-skill via validateSkillDir and validatePlugin (mismatched name, missing description, unknown field)", () => {
    const pluginDir = path.join(INVALID_DIR, "bad-skill");
    const skillDir = path.join(pluginDir, "skills", "wrong-dir");

    const skillResult = validateSkillDir(skillDir, pluginDir);
    expectValidResultShape(skillResult);
    expect(skillResult.ok).toBe(false);
    expect(skillResult.errors.length).toBeGreaterThanOrEqual(3);
    expect(hasIssueMatching(skillResult.errors, /SKILL\.md/i)).toBe(true);
    expect(
      hasIssueMatching(
        skillResult.errors,
        /other-skill|wrong-dir|match|name/i,
      ),
    ).toBe(true);
    expect(hasIssueMatching(skillResult.errors, /description/i)).toBe(true);
    expect(
      hasIssueMatching(skillResult.errors, /unknown-field|unknown|allowed/i),
    ).toBe(true);

    const pluginResult = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });
    expectValidResultShape(pluginResult);
    expect(pluginResult.ok).toBe(false);
    expect(pluginResult.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects bad-marketplace via validateMarketplace and validateRepo (missing plugin source and version mismatch)", () => {
    const repoDir = path.join(INVALID_DIR, "bad-marketplace");

    const marketplaceResult = validateMarketplace(repoDir, {
      schemasDir: SCHEMAS_DIR,
    });
    expectValidResultShape(marketplaceResult);
    expect(marketplaceResult.ok).toBe(false);
    expect(marketplaceResult.errors.length).toBeGreaterThanOrEqual(2);
    expect(
      hasIssueMatching(
        marketplaceResult.errors,
        /does-not-exist|missing-plugin|not exist|missing|source/i,
      ),
    ).toBe(true);
    expect(
      hasIssueMatching(
        marketplaceResult.errors,
        /version-mismatch-plugin|version|2\.0\.0|1\.0\.0|mismatch/i,
      ),
    ).toBe(true);

    const repoResult = validateRepo(repoDir, { schemasDir: SCHEMAS_DIR });
    expectValidResultShape(repoResult);
    expect(repoResult.ok).toBe(false);
    expect(repoResult.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects bad-antigravity-manifest via validateAntigravityManifest and validatePlugin (unknown property, deprecated sourcePath, invalid version type)", () => {
    const pluginDir = path.join(INVALID_DIR, "bad-antigravity-manifest");
    const manifestPath = path.join(
      pluginDir,
      ".antigravity-plugin",
      "plugin.json",
    );

    const manifestResult = validateAntigravityManifest(manifestPath, {
      schemasDir: SCHEMAS_DIR,
    });
    expectValidResultShape(manifestResult);
    expect(manifestResult.ok).toBe(false);
    expect(manifestResult.errors.length).toBeGreaterThanOrEqual(2);
    expect(hasIssueMatching(manifestResult.errors, /version|string/i)).toBe(
      true,
    );
    expect(
      hasIssueMatching(manifestResult.errors, /unexpectedKey|additional/i),
    ).toBe(true);

    const allIssues = [...manifestResult.errors, ...manifestResult.warnings];
    expect(hasIssueMatching(allIssues, /sourcePath|deprecated/i)).toBe(true);

    const pluginResult = validatePlugin(pluginDir, { schemasDir: SCHEMAS_DIR });
    expectValidResultShape(pluginResult);
    expect(pluginResult.ok).toBe(false);
  });
});

describe("checkSecretsInObject (Rule 9)", () => {
  it("flags keys matching secret|token|password|api_key|credential case-insensitively with hardcoded values", () => {
    const issues = checkSecretsInObject(
      {
        mySecret: "s3cr3t-value",
        AUTH_TOKEN: "tok_live_12345",
        dbPassword: "super-password",
        api_key: "key_live_999",
        CloudCredential: "cred-prod-abc",
      },
      "plugins/demo/mcp.json",
      "mcpServers.demo.env",
    );

    expectValidIssueShapes(issues, "error");
    expect(issues).toHaveLength(5);
    for (const issue of issues) {
      expect(issue.file).toBe("plugins/demo/mcp.json");
    }
    expect(hasIssueMatching(issues, /mySecret/i)).toBe(true);
    expect(hasIssueMatching(issues, /AUTH_TOKEN/i)).toBe(true);
    expect(hasIssueMatching(issues, /dbPassword/i)).toBe(true);
    expect(hasIssueMatching(issues, /api_key/i)).toBe(true);
    expect(hasIssueMatching(issues, /CloudCredential/i)).toBe(true);
  });

  it("allows empty string, changeme, example, and ${VAR} placeholder values on secret-like keys", () => {
    const issues = checkSecretsInObject(
      {
        API_KEY: "${API_KEY}",
        AUTH_TOKEN: "",
        DB_PASSWORD: "changeme",
        CLIENT_SECRET: "example",
        SERVICE_CREDENTIAL: "${SERVICE_CREDENTIAL}",
      },
      "plugins/demo/mcp.json",
      "mcpServers.demo.env",
    );

    expect(issues).toEqual([]);
  });

  it("ignores non-secret keys with arbitrary literal values", () => {
    const issues = checkSecretsInObject(
      {
        LOG_LEVEL: "debug",
        X_TENANT: "public",
        REGION: "us-central1",
      },
      "plugins/demo/mcp.json",
      "mcpServers.demo.env",
    );

    expect(issues).toEqual([]);
  });
});

describe("validateRepo Antigravity and examples enforcement", () => {
  const tempDirs: string[] = [];

  afterAll(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function createTempRepo(): string {
    const repoDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "agent-plugin-repo-test-"),
    );
    tempDirs.push(repoDir);
    fs.cpSync(VALID_REPO_DIR, repoDir, { recursive: true });
    return repoDir;
  }

  it("rejects an installable plugin in plugins/ that is omitted from .claude-plugin/marketplace.json", () => {
    const repoDir = createTempRepo();
    const extraPluginDir = path.join(repoDir, "plugins", "unlisted-plugin");
    fs.cpSync(VALID_PLUGIN_DIR, extraPluginDir, { recursive: true });
    for (const manifestPath of [
      path.join(extraPluginDir, "plugin.json"),
      path.join(extraPluginDir, ".antigravity-plugin", "plugin.json"),
    ]) {
      const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<
        string,
        unknown
      >;
      parsed.name = "unlisted-plugin";
      fs.writeFileSync(manifestPath, JSON.stringify(parsed, null, 2), "utf8");
    }

    const result = validateRepo(repoDir, { schemasDir: SCHEMAS_DIR });
    expectValidResultShape(result);
    expect(result.ok).toBe(false);
    expect(
      hasIssueMatching(result.errors, /MARKETPLACE_UNREGISTERED_PLUGIN/i),
    ).toBe(true);
  });

  it("rejects an installable plugin in plugins/ that is missing .antigravity-plugin/plugin.json", () => {
    const repoDir = createTempRepo();
    fs.rmSync(
      path.join(
        repoDir,
        "plugins",
        "sample-plugin",
        ".antigravity-plugin",
      ),
      { recursive: true, force: true },
    );

    const result = validateRepo(repoDir, { schemasDir: SCHEMAS_DIR });
    expectValidResultShape(result);
    expect(result.ok).toBe(false);
    expect(
      hasIssueMatching(result.errors, /ANTIGRAVITY_MANIFEST_MISSING/i),
    ).toBe(true);
  });

  it("validates non-installable examples/ without requiring marketplace registration and rejects marketplace entries targeting examples/", () => {
    const repoDir = createTempRepo();
    const exampleDir = path.join(repoDir, "examples", "demo-example");
    fs.cpSync(VALID_PLUGIN_DIR, exampleDir, { recursive: true });

    const validResult = validateRepo(repoDir, { schemasDir: SCHEMAS_DIR });
    expectValidResultShape(validResult);
    expect(validResult.ok).toBe(true);

    const marketplacePath = path.join(
      repoDir,
      ".claude-plugin",
      "marketplace.json",
    );
    const catalog = JSON.parse(
      fs.readFileSync(marketplacePath, "utf8"),
    ) as {
      plugins: Array<Record<string, unknown>>;
    };
    catalog.plugins.push({
      name: "sample-plugin-example",
      source: "./examples/demo-example",
      version: "1.0.0",
      description: "Should not be registered in marketplace.json.",
    });
    fs.writeFileSync(marketplacePath, JSON.stringify(catalog, null, 2), "utf8");

    const invalidResult = validateRepo(repoDir, { schemasDir: SCHEMAS_DIR });
    expectValidResultShape(invalidResult);
    expect(invalidResult.ok).toBe(false);
    expect(
      hasIssueMatching(
        invalidResult.errors,
        /MARKETPLACE_EXAMPLE_SOURCE_FORBIDDEN/i,
      ),
    ).toBe(true);
  });
});
