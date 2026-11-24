import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  checkExistingPathContainment,
  checkLexicalRelativeContainment,
  checkTargetIfExistsContainment,
  extractAgentPluginsSchemaVersion,
  isLoopbackHostname,
  isPathWithinRoot,
} from "./paths.js";
import { ajvErrorsToIssues, getCompiledSchemas } from "./schemas.js";
import {
  checkSecretsInObject,
  isSafeSecretValue,
  isSecretKey,
} from "./secrets.js";
import {
  addError,
  addWarning,
  createResult,
  isPlainObject,
  mergeResults,
  type ValidationIssue,
  type ValidationResult,
  type ValidatorOptions,
} from "./types.js";

export { checkSecretsInObject } from "./secrets.js";
export type {
  IssueSeverity,
  ValidationIssue,
  ValidationResult,
  ValidatorOptions,
} from "./types.js";

const PLUGIN_PLACEHOLDER_PATTERN = /\$\{(?:PLUGIN_ROOT|PLUGIN_DATA)\}/;
const ANY_PLACEHOLDER_PATTERN = /\$\{[^}]*\}/;

const ALLOWED_SKILL_FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
]);

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

const RESERVED_MARKETPLACE_NAMES = new Set([
  "claude-code-marketplace",
  "claude-plugins-official",
  "anthropic-marketplace",
  "agent-skills",
  "inline",
  "builtin",
  "skills-dir",
  "synced",
  "claude-plugin-test",
  "claude",
  "anthropic",
  "claude-code",
  "claude-mods",
]);

const RESERVED_PLUGIN_NAMES = new Set([
  "claude",
  "anthropic",
  "claude-code",
  "claude-mods",
  "agent-skills",
  "inline",
  "builtin",
  "skills-dir",
  "synced",
  "claude-plugin-test",
]);

const RESERVED_PLUGIN_PREFIXES = [
  "claude-",
  "anthropic-",
  "anthropics-",
  "cc-plugin-",
  "claudeai-",
];

const ANTIGRAVITY_DEPRECATED_KEYS = [
  "source",
  "sourcePath",
  "source_path",
] as const;

const ANTIGRAVITY_BRAND_PREFIX_PATTERN =
  /^(?:antigravity|gemini|claude|cursor)\b/i;

const VALID_OBJECT_MARKETPLACE_SOURCES = new Set([
  "github",
  "url",
  "git-subdir",
  "npm",
  "archive",
  "command",
]);

interface JsonReadSuccess {
  ok: true;
  data: Record<string, unknown>;
}

interface JsonReadFailure {
  ok: false;
  code: string;
  message: string;
}

type JsonReadResult = JsonReadSuccess | JsonReadFailure;

function readJsonObject(
  filePath: string,
  codePrefix: string,
): JsonReadResult {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      code: `${codePrefix}_READ_ERROR`,
      message: `Unable to read "${filePath}": ${detail}`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      code: `${codePrefix}_PARSE_ERROR`,
      message: `Invalid JSON in "${filePath}": ${detail}`,
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      code: `${codePrefix}_NOT_OBJECT`,
      message: `"${filePath}" must contain a top-level JSON object`,
    };
  }

  return { ok: true, data: parsed };
}

function isObjectPrototypeKey(name: string): boolean {
  return (
    name === "__proto__" ||
    name === "prototype" ||
    name === "constructor" ||
    Object.prototype.hasOwnProperty.call(Object.prototype, name)
  );
}

function isValidIdentifier(name: string): boolean {
  return IDENTIFIER_PATTERN.test(name) && !name.includes("..");
}

function isReservedMarketplaceName(name: string): boolean {
  const lower = name.toLowerCase();
  if (isObjectPrototypeKey(name) || isObjectPrototypeKey(lower)) {
    return true;
  }
  if (RESERVED_MARKETPLACE_NAMES.has(lower)) {
    return true;
  }
  if (lower.startsWith("claudeai-")) {
    return true;
  }
  return false;
}

function isReservedPluginName(name: string): boolean {
  const lower = name.toLowerCase();
  if (isObjectPrototypeKey(name) || isObjectPrototypeKey(lower)) {
    return true;
  }
  if (RESERVED_PLUGIN_NAMES.has(lower)) {
    return true;
  }
  for (const prefix of RESERVED_PLUGIN_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return true;
    }
  }
  if (/(?:claude|anthropic)/i.test(lower) && /official/i.test(lower)) {
    return true;
  }
  return false;
}

function isRegularFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isDirectory(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function validateStdioCommand(
  command: string,
  serverName: string,
  realPluginRoot: string,
  mcpPath: string,
  errors: ValidationIssue[],
): void {
  const hasWhitespace = /\s/.test(command);
  if (hasWhitespace) {
    addError(
      errors,
      "MCP_COMMAND_NOT_SINGLE_TOKEN",
      mcpPath,
      `mcpServers.${serverName}.command ("${command}") must be a single executable token with no whitespace`,
    );
  }

  if (ANY_PLACEHOLDER_PATTERN.test(command)) {
    addError(
      errors,
      "MCP_COMMAND_PLACEHOLDER",
      mcpPath,
      `mcpServers.${serverName}.command ("${command}") must not contain placeholder expressions such as \${PLUGIN_ROOT} or \${PLUGIN_DATA}`,
    );
  }

  if (hasWhitespace) {
    return;
  }

  const looksLikePath =
    command.includes("/") || command.includes("\\") || command.startsWith(".");
  if (!looksLikePath) {
    return;
  }

  if (command.includes("\\")) {
    addError(
      errors,
      "MCP_COMMAND_INVALID_PATH",
      mcpPath,
      `mcpServers.${serverName}.command ("${command}") must use forward slashes and start with "./"`,
    );
    return;
  }

  if (!command.startsWith("./") || command === "./") {
    addError(
      errors,
      "MCP_COMMAND_INVALID_PATH",
      mcpPath,
      `mcpServers.${serverName}.command ("${command}") must start with "./" and resolve inside plugin root (cannot escape)`,
    );
    return;
  }

  if (!checkLexicalRelativeContainment(command)) {
    addError(
      errors,
      "MCP_COMMAND_ESCAPE",
      mcpPath,
      `mcpServers.${serverName}.command ("${command}") escapes plugin root`,
    );
    return;
  }

  const resolvedTarget = path.resolve(realPluginRoot, command);
  const containment = checkTargetIfExistsContainment(
    realPluginRoot,
    resolvedTarget,
  );
  if (!containment.ok) {
    addError(
      errors,
      "MCP_COMMAND_ESCAPE",
      mcpPath,
      `mcpServers.${serverName}.command ("${command}"): ${containment.reason ?? "escapes plugin root"}`,
    );
  }
}

function validateStdioCwd(
  cwd: string,
  serverName: string,
  realPluginRoot: string,
  mcpPath: string,
  errors: ValidationIssue[],
  alreadyHasCwdSchemaError: boolean,
): void {
  if (cwd.includes("\\")) {
    addError(
      errors,
      "MCP_CWD_INVALID_PATH",
      mcpPath,
      `mcpServers.${serverName}.cwd ("${cwd}") must use forward slashes`,
    );
    return;
  }

  if (cwd.startsWith("./")) {
    if (!checkLexicalRelativeContainment(cwd)) {
      addError(
        errors,
        "MCP_CWD_ESCAPE",
        mcpPath,
        `mcpServers.${serverName}.cwd ("${cwd}") escapes plugin root`,
      );
      return;
    }
    const resolvedTarget = path.resolve(realPluginRoot, cwd);
    const containment = checkTargetIfExistsContainment(
      realPluginRoot,
      resolvedTarget,
    );
    if (!containment.ok) {
      addError(
        errors,
        "MCP_CWD_ESCAPE",
        mcpPath,
        `mcpServers.${serverName}.cwd ("${cwd}"): ${containment.reason ?? "escapes plugin root"}`,
      );
    }
    return;
  }

  if (cwd === "${PLUGIN_ROOT}" || cwd.startsWith("${PLUGIN_ROOT}/")) {
    const sub =
      cwd === "${PLUGIN_ROOT}" ? "." : cwd.slice("${PLUGIN_ROOT}/".length);
    if (sub.startsWith("/") || !checkLexicalRelativeContainment(sub || ".")) {
      addError(
        errors,
        "MCP_CWD_ESCAPE",
        mcpPath,
        `mcpServers.${serverName}.cwd ("${cwd}") escapes PLUGIN_ROOT`,
      );
      return;
    }
    const resolvedTarget = path.resolve(realPluginRoot, sub || ".");
    const containment = checkTargetIfExistsContainment(
      realPluginRoot,
      resolvedTarget,
    );
    if (!containment.ok) {
      addError(
        errors,
        "MCP_CWD_ESCAPE",
        mcpPath,
        `mcpServers.${serverName}.cwd ("${cwd}"): ${containment.reason ?? "escapes PLUGIN_ROOT"}`,
      );
    }
    return;
  }

  if (cwd === "${PLUGIN_DATA}" || cwd.startsWith("${PLUGIN_DATA}/")) {
    const sub =
      cwd === "${PLUGIN_DATA}" ? "." : cwd.slice("${PLUGIN_DATA}/".length);
    if (sub.startsWith("/") || !checkLexicalRelativeContainment(sub || ".")) {
      addError(
        errors,
        "MCP_CWD_ESCAPE",
        mcpPath,
        `mcpServers.${serverName}.cwd ("${cwd}") escapes PLUGIN_DATA`,
      );
    }
    return;
  }

  if (!alreadyHasCwdSchemaError) {
    addError(
      errors,
      "MCP_CWD_INVALID_PREFIX",
      mcpPath,
      `mcpServers.${serverName}.cwd ("${cwd}") must start with "./", "\${PLUGIN_ROOT}", or "\${PLUGIN_DATA}"`,
    );
  }
}

function validateRemoteUrl(
  urlValue: string,
  serverName: string,
  mcpPath: string,
  errors: ValidationIssue[],
): void {
  if (PLUGIN_PLACEHOLDER_PATTERN.test(urlValue)) {
    addError(
      errors,
      "MCP_DISALLOWED_PLACEHOLDER",
      mcpPath,
      `mcpServers.${serverName}.url must not contain \${PLUGIN_ROOT} or \${PLUGIN_DATA} placeholders`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(urlValue);
  } catch {
    addError(
      errors,
      "MCP_INVALID_URL",
      mcpPath,
      `mcpServers.${serverName}.url ("${urlValue}") is not a valid absolute URL`,
    );
    return;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    addError(
      errors,
      "MCP_INVALID_URL_SCHEME",
      mcpPath,
      `mcpServers.${serverName}.url ("${urlValue}") must use http: or https: scheme`,
    );
    return;
  }

  if (parsed.username !== "" || parsed.password !== "") {
    addError(
      errors,
      "MCP_URL_USERINFO",
      mcpPath,
      `mcpServers.${serverName}.url ("${urlValue}") must not contain userinfo credentials`,
    );
  }

  if (parsed.hash !== "" || urlValue.includes("#")) {
    addError(
      errors,
      "MCP_URL_FRAGMENT",
      mcpPath,
      `mcpServers.${serverName}.url ("${urlValue}") must not contain a fragment`,
    );
  }

  if (parsed.protocol === "http:" && !isLoopbackHostname(parsed.hostname)) {
    addError(
      errors,
      "MCP_INSECURE_HTTP_URL",
      mcpPath,
      `mcpServers.${serverName}.url ("${urlValue}") must use https: for non-loopback host "${parsed.hostname}"`,
    );
  }
}

export function validateMcpJson(
  mcpPath: string,
  pluginRoot: string,
  expectedPluginSchemaUrl?: string,
  options?: ValidatorOptions,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isRegularFile(mcpPath)) {
    addError(
      errors,
      "MCP_FILE_NOT_FOUND",
      mcpPath,
      `MCP configuration file "${mcpPath}" does not exist or is not a regular file`,
    );
    return createResult(errors, warnings);
  }

  const containment = checkExistingPathContainment(pluginRoot, mcpPath);
  if (!containment.ok) {
    addError(
      errors,
      "MCP_PATH_ESCAPE",
      mcpPath,
      containment.reason ?? `mcp.json resolves outside plugin root "${pluginRoot}"`,
    );
    return createResult(errors, warnings);
  }

  const read = readJsonObject(mcpPath, "MCP");
  if (!read.ok) {
    addError(errors, read.code, mcpPath, read.message);
    return createResult(errors, warnings);
  }

  const data = read.data;
  const schemas = getCompiledSchemas(options?.schemasDir);

  if (
    expectedPluginSchemaUrl !== undefined &&
    typeof data.$schema === "string"
  ) {
    const expectedVersion = extractAgentPluginsSchemaVersion(
      expectedPluginSchemaUrl,
    );
    const mcpVersion = extractAgentPluginsSchemaVersion(data.$schema);
    if (
      expectedVersion !== undefined &&
      mcpVersion !== undefined &&
      expectedVersion !== mcpVersion
    ) {
      addError(
        errors,
        "MCP_SCHEMA_VERSION_MISMATCH",
        mcpPath,
        `mcp.json $schema version "${mcpVersion}" does not match plugin.json $schema version "${expectedVersion}"`,
      );
    }
  }

  const topLevelValid = schemas.mcpTopLevel(data);
  if (!topLevelValid) {
    errors.push(
      ...ajvErrorsToIssues(
        schemas.mcpTopLevel.errors,
        mcpPath,
        "MCP_SCHEMA_ERROR",
      ),
    );
  }

  if (!isPlainObject(data.mcpServers)) {
    return createResult(errors, warnings);
  }

  let realPluginRoot: string;
  try {
    realPluginRoot = fs.realpathSync(pluginRoot);
  } catch {
    realPluginRoot = path.resolve(pluginRoot);
  }

  for (const [serverName, serverVal] of Object.entries(data.mcpServers)) {
    const serverPrefix = `mcpServers.${serverName}`;
    const serverValid = schemas.mcpServer(serverVal);
    let hasCwdSchemaError = false;

    if (!serverValid) {
      let branchErrors = schemas.mcpServer.errors;
      const rawServer: unknown = serverVal;
      if (isPlainObject(rawServer)) {
        if (rawServer.type === "stdio") {
          schemas.mcpStdioServer(rawServer);
          if (
            schemas.mcpStdioServer.errors &&
            schemas.mcpStdioServer.errors.length > 0
          ) {
            branchErrors = schemas.mcpStdioServer.errors;
          }
        } else if (rawServer.type === "streamable-http") {
          schemas.mcpStreamableHttpServer(rawServer);
          if (
            schemas.mcpStreamableHttpServer.errors &&
            schemas.mcpStreamableHttpServer.errors.length > 0
          ) {
            branchErrors = schemas.mcpStreamableHttpServer.errors;
          }
        } else if (rawServer.type === "sse") {
          schemas.mcpSseServer(rawServer);
          if (
            schemas.mcpSseServer.errors &&
            schemas.mcpSseServer.errors.length > 0
          ) {
            branchErrors = schemas.mcpSseServer.errors;
          }
        }
      }

      if (branchErrors) {
        hasCwdSchemaError = branchErrors.some((e) => e.instancePath === "/cwd");
      }

      errors.push(
        ...ajvErrorsToIssues(
          branchErrors,
          mcpPath,
          "MCP_SERVER_SCHEMA_ERROR",
          serverPrefix,
        ),
      );
    }

    if (!isPlainObject(serverVal)) {
      continue;
    }

    if (serverVal.type === "stdio") {
      if (typeof serverVal.command === "string") {
        validateStdioCommand(
          serverVal.command,
          serverName,
          realPluginRoot,
          mcpPath,
          errors,
        );
      }

      if (typeof serverVal.cwd === "string") {
        validateStdioCwd(
          serverVal.cwd,
          serverName,
          realPluginRoot,
          mcpPath,
          errors,
          hasCwdSchemaError,
        );
      }

      if (isPlainObject(serverVal.env)) {
        for (const envKey of Object.keys(serverVal.env)) {
          if (envKey === "PLUGIN_ROOT" || envKey === "PLUGIN_DATA") {
            addError(
              errors,
              "MCP_RESERVED_ENV_KEY",
              mcpPath,
              `${serverPrefix}.env must not define reserved variable "${envKey}"`,
            );
          }
          if (PLUGIN_PLACEHOLDER_PATTERN.test(envKey)) {
            addError(
              errors,
              "MCP_DISALLOWED_PLACEHOLDER",
              mcpPath,
              `${serverPrefix}.env key "${envKey}" must not contain \${PLUGIN_ROOT} or \${PLUGIN_DATA} placeholders`,
            );
          }
        }
        errors.push(
          ...checkSecretsInObject(
            serverVal.env,
            mcpPath,
            `${serverPrefix}.env`,
          ),
        );
      }
    } else if (
      serverVal.type === "streamable-http" ||
      serverVal.type === "sse"
    ) {
      if (serverVal.type === "sse") {
        addWarning(
          warnings,
          "MCP_SSE_DEPRECATED",
          mcpPath,
          `${serverPrefix} uses legacy "sse" transport, which is deprecated and optional in Agent Plugins 1.0.0`,
        );
      }

      if (typeof serverVal.url === "string") {
        validateRemoteUrl(serverVal.url, serverName, mcpPath, errors);
      }

      if (isPlainObject(serverVal.headers)) {
        const seenHeaders = new Map<string, string>();
        for (const [headerKey, headerVal] of Object.entries(
          serverVal.headers,
        )) {
          const lowerKey = headerKey.toLowerCase();
          const existing = seenHeaders.get(lowerKey);
          if (existing !== undefined) {
            addError(
              errors,
              "MCP_DUPLICATE_HEADER",
              mcpPath,
              `${serverPrefix}.headers contains duplicate case-insensitive header "${headerKey}" (conflicts with "${existing}")`,
            );
          } else {
            seenHeaders.set(lowerKey, headerKey);
          }

          if (PLUGIN_PLACEHOLDER_PATTERN.test(headerKey)) {
            addError(
              errors,
              "MCP_DISALLOWED_PLACEHOLDER",
              mcpPath,
              `${serverPrefix}.headers key "${headerKey}" must not contain \${PLUGIN_ROOT} or \${PLUGIN_DATA} placeholders`,
            );
          }
          if (
            typeof headerVal === "string" &&
            PLUGIN_PLACEHOLDER_PATTERN.test(headerVal)
          ) {
            addError(
              errors,
              "MCP_DISALLOWED_PLACEHOLDER",
              mcpPath,
              `${serverPrefix}.headers.${headerKey} must not contain \${PLUGIN_ROOT} or \${PLUGIN_DATA} placeholders`,
            );
          }
        }
        errors.push(
          ...checkSecretsInObject(
            serverVal.headers,
            mcpPath,
            `${serverPrefix}.headers`,
          ),
        );
      }
    }
  }

  return createResult(errors, warnings);
}

export function validateAntigravityMcpConfig(
  mcpConfigPath: string,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isRegularFile(mcpConfigPath)) {
    addError(
      errors,
      "ANTIGRAVITY_MCP_NOT_FOUND",
      mcpConfigPath,
      `Antigravity MCP config "${mcpConfigPath}" does not exist or is not a regular file`,
    );
    return createResult(errors, warnings);
  }

  const read = readJsonObject(mcpConfigPath, "ANTIGRAVITY_MCP");
  if (!read.ok) {
    addError(errors, read.code, mcpConfigPath, read.message);
    return createResult(errors, warnings);
  }

  const data = read.data;

  if ("variables" in data) {
    addError(
      errors,
      "ANTIGRAVITY_MCP_ROOT_VARIABLES",
      mcpConfigPath,
      `Top-level "variables" is not allowed in mcp_config.json; declare variables inside mcpServers.<server>.variables`,
    );
  }

  if (!isPlainObject(data.mcpServers)) {
    addError(
      errors,
      "ANTIGRAVITY_MCP_MISSING_SERVERS",
      mcpConfigPath,
      `mcp_config.json must contain a "mcpServers" object`,
    );
    return createResult(errors, warnings);
  }

  for (const [serverName, serverVal] of Object.entries(data.mcpServers)) {
    const serverPrefix = `mcpServers.${serverName}`;
    if (!isPlainObject(serverVal)) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_INVALID_SERVER",
        mcpConfigPath,
        `${serverPrefix} must be a JSON object`,
      );
      continue;
    }

    const hasCommand =
      "command" in serverVal && serverVal.command !== undefined;
    const hasServerUrl =
      "serverUrl" in serverVal && serverVal.serverUrl !== undefined;
    const hasUrl = "url" in serverVal && serverVal.url !== undefined;
    const hasHttpUrl =
      "httpUrl" in serverVal && serverVal.httpUrl !== undefined;
    const hasRemoteUrl = hasServerUrl || hasUrl;

    if (hasHttpUrl) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_HTTP_URL_UNSUPPORTED",
        mcpConfigPath,
        `${serverPrefix} uses unsupported "httpUrl"; use "serverUrl" or "url" for Streamable HTTP`,
      );
    }

    if (serverVal.type === "sse") {
      addError(
        errors,
        "ANTIGRAVITY_MCP_SSE_UNSUPPORTED",
        mcpConfigPath,
        `${serverPrefix} specifies legacy "sse" transport, which is unsupported in Antigravity mcp_config.json`,
      );
    }

    if (hasCommand && hasRemoteUrl) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_AMBIGUOUS_TRANSPORT",
        mcpConfigPath,
        `${serverPrefix} cannot specify both "command" and "serverUrl"/"url"`,
      );
    } else if (!hasCommand && !hasRemoteUrl && !hasHttpUrl) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_MISSING_TRANSPORT",
        mcpConfigPath,
        `${serverPrefix} must specify either "command" (stdio) or "serverUrl"/"url" (Streamable HTTP)`,
      );
    }

    if (hasServerUrl && hasUrl) {
      addWarning(
        warnings,
        "ANTIGRAVITY_MCP_DUPLICATE_URL",
        mcpConfigPath,
        `${serverPrefix} specifies both "serverUrl" and "url"; prefer "serverUrl"`,
      );
    }

    if (
      hasCommand &&
      (typeof serverVal.command !== "string" ||
        serverVal.command.trim().length === 0)
    ) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_INVALID_COMMAND",
        mcpConfigPath,
        `${serverPrefix}.command must be a non-empty string`,
      );
    }

    if (
      hasServerUrl &&
      (typeof serverVal.serverUrl !== "string" ||
        serverVal.serverUrl.trim().length === 0)
    ) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_INVALID_URL",
        mcpConfigPath,
        `${serverPrefix}.serverUrl must be a non-empty string`,
      );
    }

    if (
      hasUrl &&
      (typeof serverVal.url !== "string" || serverVal.url.trim().length === 0)
    ) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_INVALID_URL",
        mcpConfigPath,
        `${serverPrefix}.url must be a non-empty string`,
      );
    }

    if (serverVal.args !== undefined) {
      if (
        !Array.isArray(serverVal.args) ||
        !serverVal.args.every((item) => typeof item === "string")
      ) {
        addError(
          errors,
          "ANTIGRAVITY_MCP_INVALID_ARGS",
          mcpConfigPath,
          `${serverPrefix}.args must be an array of strings`,
        );
      }
    }

    if (serverVal.cwd !== undefined && typeof serverVal.cwd !== "string") {
      addError(
        errors,
        "ANTIGRAVITY_MCP_INVALID_CWD",
        mcpConfigPath,
        `${serverPrefix}.cwd must be a string`,
      );
    }

    if (serverVal.env !== undefined) {
      if (!isPlainObject(serverVal.env)) {
        addError(
          errors,
          "ANTIGRAVITY_MCP_INVALID_ENV",
          mcpConfigPath,
          `${serverPrefix}.env must be an object`,
        );
      } else {
        for (const [envKey, envVal] of Object.entries(serverVal.env)) {
          if (envKey === "PLUGIN_ROOT" || envKey === "PLUGIN_DATA") {
            addError(
              errors,
              "ANTIGRAVITY_MCP_RESERVED_ENV_KEY",
              mcpConfigPath,
              `${serverPrefix}.env must not define reserved variable "${envKey}"`,
            );
          }
          if (typeof envVal !== "string") {
            addError(
              errors,
              "ANTIGRAVITY_MCP_INVALID_ENV_VALUE",
              mcpConfigPath,
              `${serverPrefix}.env.${envKey} must be a string`,
            );
          }
        }
        errors.push(
          ...checkSecretsInObject(
            serverVal.env,
            mcpConfigPath,
            `${serverPrefix}.env`,
          ),
        );
      }
    }

    if (serverVal.headers !== undefined) {
      if (!isPlainObject(serverVal.headers)) {
        addError(
          errors,
          "ANTIGRAVITY_MCP_INVALID_HEADERS",
          mcpConfigPath,
          `${serverPrefix}.headers must be an object`,
        );
      } else {
        for (const [headerKey, headerVal] of Object.entries(
          serverVal.headers,
        )) {
          if (typeof headerVal !== "string") {
            addError(
              errors,
              "ANTIGRAVITY_MCP_INVALID_HEADER_VALUE",
              mcpConfigPath,
              `${serverPrefix}.headers.${headerKey} must be a string`,
            );
          }
        }
        errors.push(
          ...checkSecretsInObject(
            serverVal.headers,
            mcpConfigPath,
            `${serverPrefix}.headers`,
          ),
        );
      }
    }

    if (serverVal.oauth !== undefined) {
      if (!isPlainObject(serverVal.oauth)) {
        addError(
          errors,
          "ANTIGRAVITY_MCP_INVALID_OAUTH",
          mcpConfigPath,
          `${serverPrefix}.oauth must be an object`,
        );
      } else {
        errors.push(
          ...checkSecretsInObject(
            serverVal.oauth,
            mcpConfigPath,
            `${serverPrefix}.oauth`,
          ),
        );
      }
    }

    if (serverVal.variables !== undefined) {
      if (!Array.isArray(serverVal.variables)) {
        addError(
          errors,
          "ANTIGRAVITY_MCP_INVALID_VARIABLES",
          mcpConfigPath,
          `${serverPrefix}.variables must be an array`,
        );
      } else {
        for (let i = 0; i < serverVal.variables.length; i += 1) {
          const item = serverVal.variables[i];
          if (!isPlainObject(item)) {
            addError(
              errors,
              "ANTIGRAVITY_MCP_INVALID_VARIABLE",
              mcpConfigPath,
              `${serverPrefix}.variables[${i}] must be an object`,
            );
            continue;
          }

          if (typeof item.name !== "string" || item.name.trim().length === 0) {
            addError(
              errors,
              "ANTIGRAVITY_MCP_INVALID_VARIABLE_NAME",
              mcpConfigPath,
              `${serverPrefix}.variables[${i}].name must be a non-empty string`,
            );
          }

          for (const optField of ["title", "description", "link"] as const) {
            if (
              item[optField] !== undefined &&
              typeof item[optField] !== "string"
            ) {
              addError(
                errors,
                "ANTIGRAVITY_MCP_INVALID_VARIABLE_FIELD",
                mcpConfigPath,
                `${serverPrefix}.variables[${i}].${optField} must be a string`,
              );
            }
          }

          if (
            typeof item.name === "string" &&
            isSecretKey(item.name) &&
            typeof item.default === "string" &&
            !isSafeSecretValue(item.default)
          ) {
            addError(
              errors,
              "SECRET_HARDCODED",
              mcpConfigPath,
              `Potential hardcoded secret in ${serverPrefix}.variables[${i}].default for "${item.name}": secret-like variables must use "", "changeme", "example", or a \${VAR} placeholder`,
            );
          }
        }
      }
    }

    if (
      serverVal.timeoutSeconds !== undefined &&
      (typeof serverVal.timeoutSeconds !== "number" ||
        !Number.isInteger(serverVal.timeoutSeconds))
    ) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_INVALID_TIMEOUT",
        mcpConfigPath,
        `${serverPrefix}.timeoutSeconds must be an integer`,
      );
    }

    if (
      serverVal.authProviderType !== undefined &&
      serverVal.authProviderType !== "google_credentials"
    ) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_INVALID_AUTH_PROVIDER",
        mcpConfigPath,
        `${serverPrefix}.authProviderType must be "google_credentials"`,
      );
    }

    if (
      serverVal.disabled !== undefined &&
      typeof serverVal.disabled !== "boolean"
    ) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_INVALID_DISABLED",
        mcpConfigPath,
        `${serverPrefix}.disabled must be a boolean`,
      );
    }

    for (const toolListKey of ["enabledTools", "disabledTools"] as const) {
      const list = serverVal[toolListKey];
      if (
        list !== undefined &&
        (!Array.isArray(list) ||
          !list.every((entry) => typeof entry === "string"))
      ) {
        addError(
          errors,
          "ANTIGRAVITY_MCP_INVALID_TOOL_LIST",
          mcpConfigPath,
          `${serverPrefix}.${toolListKey} must be an array of strings`,
        );
      }
    }

    if (serverVal.tools !== undefined) {
      if (!isPlainObject(serverVal.tools)) {
        addError(
          errors,
          "ANTIGRAVITY_MCP_INVALID_TOOLS",
          mcpConfigPath,
          `${serverPrefix}.tools must be an object`,
        );
      } else {
        for (const [toolName, toolConfig] of Object.entries(serverVal.tools)) {
          if (!isPlainObject(toolConfig)) {
            addError(
              errors,
              "ANTIGRAVITY_MCP_INVALID_TOOL_CONFIG",
              mcpConfigPath,
              `${serverPrefix}.tools.${toolName} must be an object`,
            );
            continue;
          }
          if (
            toolConfig.eager !== undefined &&
            typeof toolConfig.eager !== "boolean"
          ) {
            addError(
              errors,
              "ANTIGRAVITY_MCP_INVALID_TOOL_CONFIG",
              mcpConfigPath,
              `${serverPrefix}.tools.${toolName}.eager must be a boolean`,
            );
          }
          if (
            toolConfig.background !== undefined &&
            toolConfig.background !== "off" &&
            toolConfig.background !== "always"
          ) {
            addError(
              errors,
              "ANTIGRAVITY_MCP_INVALID_TOOL_CONFIG",
              mcpConfigPath,
              `${serverPrefix}.tools.${toolName}.background must be "off" or "always"`,
            );
          }
        }
      }
    }
  }

  return createResult(errors, warnings);
}

export function validateAntigravityManifest(
  manifestPath: string,
  options?: ValidatorOptions,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isRegularFile(manifestPath)) {
    addError(
      errors,
      "ANTIGRAVITY_MANIFEST_NOT_FOUND",
      manifestPath,
      `Antigravity plugin manifest "${manifestPath}" does not exist or is not a regular file`,
    );
    return createResult(errors, warnings);
  }

  const read = readJsonObject(manifestPath, "ANTIGRAVITY_MANIFEST");
  if (!read.ok) {
    addError(errors, read.code, manifestPath, read.message);
    return createResult(errors, warnings);
  }

  const data = read.data;
  const schemas = getCompiledSchemas(options?.schemasDir);

  const valid = schemas.antigravityPlugin(data);
  if (!valid) {
    errors.push(
      ...ajvErrorsToIssues(
        schemas.antigravityPlugin.errors,
        manifestPath,
        "ANTIGRAVITY_SCHEMA_ERROR",
      ),
    );
  }

  for (const deprecatedKey of ANTIGRAVITY_DEPRECATED_KEYS) {
    if (deprecatedKey in data) {
      addWarning(
        warnings,
        "ANTIGRAVITY_DEPRECATED_FIELD",
        manifestPath,
        `Deprecated field "${deprecatedKey}" should not be set in Antigravity plugin manifest`,
      );
    }
  }

  if (
    typeof data.name === "string" &&
    ANTIGRAVITY_BRAND_PREFIX_PATTERN.test(data.name)
  ) {
    addWarning(
      warnings,
      "ANTIGRAVITY_BRAND_PREFIX",
      manifestPath,
      `Antigravity plugin name "${data.name}" should not begin with a platform brand name`,
    );
  }

  if (
    typeof data.displayName === "string" &&
    ANTIGRAVITY_BRAND_PREFIX_PATTERN.test(data.displayName)
  ) {
    addWarning(
      warnings,
      "ANTIGRAVITY_BRAND_PREFIX",
      manifestPath,
      `Antigravity displayName "${data.displayName}" should not begin with a platform brand name`,
    );
  }

  return createResult(errors, warnings);
}

export function validateSkillDir(
  skillDir: string,
  pluginRoot?: string,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isDirectory(skillDir)) {
    addError(
      errors,
      "SKILL_DIR_NOT_FOUND",
      skillDir,
      `Skill directory "${skillDir}" does not exist or is not a directory`,
    );
    return createResult(errors, warnings);
  }

  const containmentRoot = pluginRoot ?? skillDir;
  if (pluginRoot !== undefined) {
    const dirCheck = checkExistingPathContainment(pluginRoot, skillDir);
    if (!dirCheck.ok) {
      addError(
        errors,
        "SKILL_DIR_ESCAPE",
        skillDir,
        dirCheck.reason ?? `Skill directory escapes plugin root "${pluginRoot}"`,
      );
      return createResult(errors, warnings);
    }
  }

  const skillMdPath = path.join(skillDir, "SKILL.md");
  let entries: string[];
  try {
    entries = fs.readdirSync(skillDir);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    addError(
      errors,
      "SKILL_DIR_READ_ERROR",
      skillDir,
      `Unable to read skill directory "${skillDir}": ${detail}`,
    );
    return createResult(errors, warnings);
  }

  if (!entries.includes("SKILL.md") || !isRegularFile(skillMdPath)) {
    addError(
      errors,
      "SKILL_MD_MISSING",
      skillMdPath,
      `Skill directory "${skillDir}" must contain a regular file named exactly "SKILL.md"`,
    );
    return createResult(errors, warnings);
  }

  const fileCheck = checkExistingPathContainment(containmentRoot, skillMdPath);
  if (!fileCheck.ok) {
    addError(
      errors,
      "SKILL_MD_ESCAPE",
      skillMdPath,
      fileCheck.reason ?? `SKILL.md resolves outside "${containmentRoot}"`,
    );
    return createResult(errors, warnings);
  }

  let content: string;
  try {
    content = fs.readFileSync(skillMdPath, "utf8");
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    addError(
      errors,
      "SKILL_MD_READ_ERROR",
      skillMdPath,
      `Unable to read "${skillMdPath}": ${detail}`,
    );
    return createResult(errors, warnings);
  }

  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines[0]?.trimEnd() !== "---") {
    addError(
      errors,
      "SKILL_FRONTMATTER_MISSING",
      skillMdPath,
      `SKILL.md must begin with YAML frontmatter delimited by "---"`,
    );
    return createResult(errors, warnings);
  }

  let closingLineIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i]?.trimEnd() === "---") {
      closingLineIndex = i;
      break;
    }
  }

  if (closingLineIndex === -1) {
    addError(
      errors,
      "SKILL_FRONTMATTER_UNCLOSED",
      skillMdPath,
      `SKILL.md YAML frontmatter is missing a closing "---" delimiter`,
    );
    return createResult(errors, warnings);
  }

  const frontmatterYaml = lines.slice(1, closingLineIndex).join("\n");
  let parsed: unknown;
  try {
    parsed = parseYaml(frontmatterYaml);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    addError(
      errors,
      "SKILL_FRONTMATTER_PARSE_ERROR",
      skillMdPath,
      `Invalid YAML frontmatter in SKILL.md: ${detail}`,
    );
    return createResult(errors, warnings);
  }

  if (!isPlainObject(parsed)) {
    addError(
      errors,
      "SKILL_FRONTMATTER_NOT_OBJECT",
      skillMdPath,
      `SKILL.md frontmatter must be a YAML mapping`,
    );
    return createResult(errors, warnings);
  }

  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_SKILL_FRONTMATTER_KEYS.has(key)) {
      addError(
        errors,
        "SKILL_UNKNOWN_FIELD",
        skillMdPath,
        `Unknown frontmatter field "${key}" in SKILL.md (allowed fields: name, description, license, compatibility, metadata, allowed-tools)`,
      );
    }
  }

  // Validate required `name`
  const rawName = parsed.name;
  const expectedDirName = path.basename(path.resolve(skillDir)).normalize("NFKC");
  if (typeof rawName !== "string" || rawName.trim().length === 0) {
    addError(
      errors,
      "SKILL_MISSING_NAME",
      skillMdPath,
      `SKILL.md frontmatter requires a non-empty string "name"`,
    );
  } else {
    const normalizedName = rawName.normalize("NFKC").trim();
    if (normalizedName.length < 1 || normalizedName.length > 64) {
      addError(
        errors,
        "SKILL_INVALID_NAME",
        skillMdPath,
        `SKILL.md name "${normalizedName}" must be 1 to 64 characters`,
      );
    }
    if (
      normalizedName !== normalizedName.toLowerCase() ||
      !/^[\p{L}\p{N}-]+$/u.test(normalizedName)
    ) {
      addError(
        errors,
        "SKILL_INVALID_NAME",
        skillMdPath,
        `SKILL.md name "${normalizedName}" must contain only lowercase alphanumeric characters and hyphens`,
      );
    }
    if (normalizedName.startsWith("-") || normalizedName.endsWith("-")) {
      addError(
        errors,
        "SKILL_INVALID_NAME",
        skillMdPath,
        `SKILL.md name "${normalizedName}" must not start or end with "-"`,
      );
    }
    if (normalizedName.includes("--")) {
      addError(
        errors,
        "SKILL_INVALID_NAME",
        skillMdPath,
        `SKILL.md name "${normalizedName}" must not contain consecutive hyphens "--"`,
      );
    }
    if (normalizedName !== expectedDirName) {
      addError(
        errors,
        "SKILL_NAME_MISMATCH",
        skillMdPath,
        `SKILL.md name "${normalizedName}" does not match parent directory name "${expectedDirName}"`,
      );
    }
  }

  // Validate required `description`
  const rawDescription = parsed.description;
  if (typeof rawDescription !== "string" || rawDescription.trim().length === 0) {
    addError(
      errors,
      "SKILL_MISSING_DESCRIPTION",
      skillMdPath,
      `SKILL.md frontmatter requires a non-empty string "description"`,
    );
  } else if (rawDescription.length > 1024) {
    addError(
      errors,
      "SKILL_INVALID_DESCRIPTION",
      skillMdPath,
      `SKILL.md description must be at most 1024 characters (got ${rawDescription.length})`,
    );
  }

  // Validate optional `license`
  if (parsed.license !== undefined && typeof parsed.license !== "string") {
    addError(
      errors,
      "SKILL_INVALID_LICENSE",
      skillMdPath,
      `SKILL.md frontmatter "license" must be a string`,
    );
  }

  // Validate optional `compatibility`
  if (parsed.compatibility !== undefined) {
    if (typeof parsed.compatibility !== "string") {
      addError(
        errors,
        "SKILL_INVALID_COMPATIBILITY",
        skillMdPath,
        `SKILL.md frontmatter "compatibility" must be a string`,
      );
    } else if (
      parsed.compatibility.trim().length === 0 ||
      parsed.compatibility.length > 500
    ) {
      addError(
        errors,
        "SKILL_INVALID_COMPATIBILITY",
        skillMdPath,
        `SKILL.md frontmatter "compatibility" must be 1 to 500 characters when provided`,
      );
    }
  }

  // Validate optional `metadata`
  if (parsed.metadata !== undefined) {
    if (!isPlainObject(parsed.metadata)) {
      addError(
        errors,
        "SKILL_INVALID_METADATA",
        skillMdPath,
        `SKILL.md frontmatter "metadata" must be a mapping of string keys to string values`,
      );
    } else {
      for (const [metaKey, metaVal] of Object.entries(parsed.metadata)) {
        if (typeof metaVal !== "string") {
          addError(
            errors,
            "SKILL_INVALID_METADATA",
            skillMdPath,
            `SKILL.md frontmatter metadata.${metaKey} must be a string`,
          );
        }
      }
    }
  }

  // Validate optional `allowed-tools`
  if (
    parsed["allowed-tools"] !== undefined &&
    typeof parsed["allowed-tools"] !== "string"
  ) {
    addError(
      errors,
      "SKILL_INVALID_ALLOWED_TOOLS",
      skillMdPath,
      `SKILL.md frontmatter "allowed-tools" must be a string`,
    );
  }

  return createResult(errors, warnings);
}

export function validatePlugin(
  pluginDir: string,
  options?: ValidatorOptions,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isDirectory(pluginDir)) {
    addError(
      errors,
      "PLUGIN_DIR_NOT_FOUND",
      pluginDir,
      `Plugin directory "${pluginDir}" does not exist or is not a directory`,
    );
    return createResult(errors, warnings);
  }

  const pluginJsonPath = path.join(pluginDir, "plugin.json");
  let pluginData: Record<string, unknown> | undefined;

  // Check 1: Portable plugin.json
  if (!isRegularFile(pluginJsonPath)) {
    addError(
      errors,
      "PLUGIN_MANIFEST_MISSING",
      pluginJsonPath,
      `Required plugin manifest "${pluginJsonPath}" does not exist or is not a regular file`,
    );
  } else {
    const manifestContainment = checkExistingPathContainment(
      pluginDir,
      pluginJsonPath,
    );
    if (!manifestContainment.ok) {
      addError(
        errors,
        "PLUGIN_MANIFEST_ESCAPE",
        pluginJsonPath,
        manifestContainment.reason ??
          `plugin.json resolves outside plugin root "${pluginDir}"`,
      );
    } else {
      const read = readJsonObject(pluginJsonPath, "PLUGIN_MANIFEST");
      if (!read.ok) {
        addError(errors, read.code, pluginJsonPath, read.message);
      } else {
        pluginData = read.data;
        const schemas = getCompiledSchemas(options?.schemasDir);
        const valid = schemas.plugin(pluginData);
        if (!valid) {
          errors.push(
            ...ajvErrorsToIssues(
              schemas.plugin.errors,
              pluginJsonPath,
              "PLUGIN_SCHEMA_ERROR",
            ),
          );
        }
      }
    }
  }

  const expectedPluginSchemaUrl =
    typeof pluginData?.$schema === "string" ? pluginData.$schema : undefined;

  // Check 2, 3, 4: Agent Plugins mcp.json (if present)
  const mcpJsonPath = path.join(pluginDir, "mcp.json");
  if (fs.existsSync(mcpJsonPath)) {
    const mcpResult = validateMcpJson(
      mcpJsonPath,
      pluginDir,
      expectedPluginSchemaUrl,
      options,
    );
    mergeResults(errors, warnings, mcpResult);
  }

  // Check 5: Skills discovery (immediate child directories of skills/, non-recursive)
  const skillsDir = path.join(pluginDir, "skills");
  if (fs.existsSync(skillsDir)) {
    if (!isDirectory(skillsDir)) {
      addError(
        errors,
        "PLUGIN_SKILLS_NOT_DIRECTORY",
        skillsDir,
        `"skills" component path "${skillsDir}" must be a directory`,
      );
    } else {
      const skillsContainment = checkExistingPathContainment(
        pluginDir,
        skillsDir,
      );
      if (!skillsContainment.ok) {
        addError(
          errors,
          "PLUGIN_SKILLS_ESCAPE",
          skillsDir,
          skillsContainment.reason ??
            `skills/ directory resolves outside plugin root "${pluginDir}"`,
        );
      } else {
        const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
        for (const entry of entries) {
          const childPath = path.join(skillsDir, entry.name);
          if (entry.isDirectory() || (entry.isSymbolicLink() && isDirectory(childPath))) {
            const skillResult = validateSkillDir(childPath, pluginDir);
            mergeResults(errors, warnings, skillResult);
          }
        }
      }
    }
  }

  // Check 7: Antigravity manifest (.antigravity-plugin/plugin.json) & mcp_config.json
  const agManifestPath = path.join(
    pluginDir,
    ".antigravity-plugin",
    "plugin.json",
  );
  if (fs.existsSync(agManifestPath)) {
    const agContainment = checkExistingPathContainment(
      pluginDir,
      agManifestPath,
    );
    if (!agContainment.ok) {
      addError(
        errors,
        "ANTIGRAVITY_MANIFEST_ESCAPE",
        agManifestPath,
        agContainment.reason ??
          `.antigravity-plugin/plugin.json resolves outside plugin root "${pluginDir}"`,
      );
    } else {
      const agResult = validateAntigravityManifest(agManifestPath, options);
      mergeResults(errors, warnings, agResult);

      if (pluginData !== undefined) {
        const agRead = readJsonObject(agManifestPath, "ANTIGRAVITY_MANIFEST");
        if (agRead.ok) {
          if (
            typeof pluginData.name === "string" &&
            typeof agRead.data.name === "string" &&
            pluginData.name !== agRead.data.name
          ) {
            addError(
              errors,
              "ANTIGRAVITY_NAME_MISMATCH",
              agManifestPath,
              `Antigravity manifest name "${agRead.data.name}" does not match plugin.json name "${pluginData.name}"`,
            );
          }
          if (
            typeof pluginData.version === "string" &&
            typeof agRead.data.version === "string" &&
            pluginData.version !== agRead.data.version
          ) {
            addError(
              errors,
              "ANTIGRAVITY_VERSION_MISMATCH",
              agManifestPath,
              `Antigravity manifest version "${agRead.data.version}" does not match plugin.json version "${pluginData.version}"`,
            );
          }
        }
      }
    }
  }

  const agMcpConfigPath = path.join(pluginDir, "mcp_config.json");
  if (fs.existsSync(agMcpConfigPath)) {
    const agMcpContainment = checkExistingPathContainment(
      pluginDir,
      agMcpConfigPath,
    );
    if (!agMcpContainment.ok) {
      addError(
        errors,
        "ANTIGRAVITY_MCP_ESCAPE",
        agMcpConfigPath,
        agMcpContainment.reason ??
          `mcp_config.json resolves outside plugin root "${pluginDir}"`,
      );
    } else {
      const agMcpResult = validateAntigravityMcpConfig(agMcpConfigPath);
      mergeResults(errors, warnings, agMcpResult);
    }
  }

  return createResult(errors, warnings);
}

export function validateMarketplace(
  repoRoot: string,
  _options?: ValidatorOptions,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isDirectory(repoRoot)) {
    addError(
      errors,
      "MARKETPLACE_ROOT_NOT_FOUND",
      repoRoot,
      `Repository root "${repoRoot}" does not exist or is not a directory`,
    );
    return createResult(errors, warnings);
  }

  const marketplacePath = path.join(
    repoRoot,
    ".claude-plugin",
    "marketplace.json",
  );
  if (!isRegularFile(marketplacePath)) {
    addError(
      errors,
      "MARKETPLACE_FILE_MISSING",
      marketplacePath,
      `Marketplace catalog "${marketplacePath}" does not exist or is not a regular file`,
    );
    return createResult(errors, warnings);
  }

  const catalogContainment = checkExistingPathContainment(
    repoRoot,
    marketplacePath,
  );
  if (!catalogContainment.ok) {
    addError(
      errors,
      "MARKETPLACE_FILE_ESCAPE",
      marketplacePath,
      catalogContainment.reason ??
        `marketplace.json resolves outside repository root "${repoRoot}"`,
    );
    return createResult(errors, warnings);
  }

  const read = readJsonObject(marketplacePath, "MARKETPLACE");
  if (!read.ok) {
    addError(errors, read.code, marketplacePath, read.message);
    return createResult(errors, warnings);
  }

  const data = read.data;

  // Top-level name
  if (typeof data.name !== "string" || data.name.trim().length === 0) {
    addError(
      errors,
      "MARKETPLACE_INVALID_NAME",
      marketplacePath,
      `marketplace.json requires a non-empty string "name"`,
    );
  } else if (!isValidIdentifier(data.name)) {
    addError(
      errors,
      "MARKETPLACE_INVALID_NAME",
      marketplacePath,
      `marketplace.json name "${data.name}" must start with an ASCII letter or digit, contain only [a-zA-Z0-9._-], and not include ".."`,
    );
  } else if (isReservedMarketplaceName(data.name)) {
    addError(
      errors,
      "MARKETPLACE_RESERVED_NAME",
      marketplacePath,
      `marketplace.json name "${data.name}" is reserved`,
    );
  }

  // Top-level owner
  if (!isPlainObject(data.owner)) {
    addError(
      errors,
      "MARKETPLACE_INVALID_OWNER",
      marketplacePath,
      `marketplace.json requires an "owner" object`,
    );
  } else {
    if (
      typeof data.owner.name !== "string" ||
      data.owner.name.trim().length === 0
    ) {
      addError(
        errors,
        "MARKETPLACE_INVALID_OWNER_NAME",
        marketplacePath,
        `marketplace.json requires a non-empty string "owner.name"`,
      );
    }
    if (
      data.owner.email !== undefined &&
      typeof data.owner.email !== "string"
    ) {
      addError(
        errors,
        "MARKETPLACE_INVALID_OWNER_FIELD",
        marketplacePath,
        `marketplace.json "owner.email" must be a string`,
      );
    }
    if (data.owner.url !== undefined && typeof data.owner.url !== "string") {
      addError(
        errors,
        "MARKETPLACE_INVALID_OWNER_FIELD",
        marketplacePath,
        `marketplace.json "owner.url" must be a string`,
      );
    }
  }

  if (
    typeof data.description !== "string" ||
    data.description.trim().length === 0
  ) {
    addWarning(
      warnings,
      "MARKETPLACE_MISSING_DESCRIPTION",
      marketplacePath,
      `marketplace.json should include a non-empty "description"`,
    );
  }

  if (!Array.isArray(data.plugins)) {
    addError(
      errors,
      "MARKETPLACE_INVALID_PLUGINS",
      marketplacePath,
      `marketplace.json requires a "plugins" array`,
    );
    return createResult(errors, warnings);
  }

  let realRepoRoot: string;
  try {
    realRepoRoot = fs.realpathSync(repoRoot);
  } catch {
    realRepoRoot = path.resolve(repoRoot);
  }

  const seenPluginNames = new Set<string>();

  for (let i = 0; i < data.plugins.length; i += 1) {
    const entry = data.plugins[i];
    const entryLabel = `plugins[${i}]`;

    if (!isPlainObject(entry)) {
      addError(
        errors,
        "MARKETPLACE_INVALID_PLUGIN_ENTRY",
        marketplacePath,
        `${entryLabel} must be an object`,
      );
      continue;
    }

    const entryName = typeof entry.name === "string" ? entry.name : undefined;
    if (entryName === undefined || entryName.trim().length === 0) {
      addError(
        errors,
        "MARKETPLACE_PLUGIN_INVALID_NAME",
        marketplacePath,
        `${entryLabel} requires a non-empty string "name"`,
      );
    } else {
      if (!isValidIdentifier(entryName)) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_INVALID_NAME",
          marketplacePath,
          `${entryLabel} name "${entryName}" must start with an ASCII letter or digit, contain only [a-zA-Z0-9._-], and not include ".."`,
        );
      } else if (isReservedPluginName(entryName)) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_RESERVED_NAME",
          marketplacePath,
          `${entryLabel} name "${entryName}" is reserved`,
        );
      }

      if (seenPluginNames.has(entryName)) {
        addError(
          errors,
          "MARKETPLACE_DUPLICATE_PLUGIN",
          marketplacePath,
          `Duplicate plugin entry name "${entryName}" in marketplace.json`,
        );
      } else {
        seenPluginNames.add(entryName);
      }
    }

    if (entry.version !== undefined && typeof entry.version !== "string") {
      addError(
        errors,
        "MARKETPLACE_PLUGIN_INVALID_VERSION",
        marketplacePath,
        `${entryLabel} ("${entryName ?? "unknown"}") "version" must be a string`,
      );
    }

    const source = entry.source;
    if (typeof source === "string") {
      if (source.includes("\\")) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_INVALID_SOURCE",
          marketplacePath,
          `${entryLabel} ("${entryName ?? "unknown"}") source "${source}" must not contain backslashes`,
        );
        continue;
      }
      if (source.includes("..")) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_INVALID_SOURCE",
          marketplacePath,
          `${entryLabel} ("${entryName ?? "unknown"}") source "${source}" must not contain ".."`,
        );
        continue;
      }
      if (source !== "." && !source.startsWith("./")) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_INVALID_SOURCE",
          marketplacePath,
          `${entryLabel} ("${entryName ?? "unknown"}") relative source "${source}" must start with "./" or be "."`,
        );
        continue;
      }

      const targetDir = path.resolve(realRepoRoot, source);
      if (!isPathWithinRoot(realRepoRoot, targetDir)) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_SOURCE_ESCAPE",
          marketplacePath,
          `${entryLabel} ("${entryName ?? "unknown"}") source "${source}" escapes repository root`,
        );
        continue;
      }

      if (!isDirectory(targetDir)) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_SOURCE_MISSING",
          marketplacePath,
          `${entryLabel} ("${entryName ?? "unknown"}") source "${source}" does not exist or is not a directory`,
        );
        continue;
      }

      const targetContainment = checkExistingPathContainment(
        realRepoRoot,
        targetDir,
      );
      if (!targetContainment.ok) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_SOURCE_ESCAPE",
          marketplacePath,
          `${entryLabel} ("${entryName ?? "unknown"}") source "${source}": ${targetContainment.reason ?? "escapes repository root"}`,
        );
        continue;
      }

      // Cross-check name and version against target plugin's plugin.json
      const targetPluginJsonPath = path.join(targetDir, "plugin.json");
      if (isRegularFile(targetPluginJsonPath)) {
        const pluginRead = readJsonObject(
          targetPluginJsonPath,
          "PLUGIN_MANIFEST",
        );
        if (pluginRead.ok) {
          if (
            entryName !== undefined &&
            typeof pluginRead.data.name === "string" &&
            pluginRead.data.name !== entryName
          ) {
            addError(
              errors,
              "MARKETPLACE_PLUGIN_NAME_MISMATCH",
              marketplacePath,
              `Marketplace plugin "${entryName}" does not match plugin.json name "${pluginRead.data.name}" at "${source}"`,
            );
          }
          if (
            typeof entry.version === "string" &&
            typeof pluginRead.data.version === "string" &&
            pluginRead.data.version !== entry.version
          ) {
            addError(
              errors,
              "MARKETPLACE_PLUGIN_VERSION_MISMATCH",
              marketplacePath,
              `Marketplace plugin "${entryName ?? "unknown"}" version "${entry.version}" mismatches plugin.json version "${pluginRead.data.version}" at "${source}"`,
            );
          }
        }
      }

      // Cross-check name and version against .antigravity-plugin/plugin.json if present
      const targetAgManifestPath = path.join(
        targetDir,
        ".antigravity-plugin",
        "plugin.json",
      );
      if (isRegularFile(targetAgManifestPath)) {
        const agRead = readJsonObject(
          targetAgManifestPath,
          "ANTIGRAVITY_MANIFEST",
        );
        if (agRead.ok) {
          if (
            entryName !== undefined &&
            typeof agRead.data.name === "string" &&
            agRead.data.name !== entryName
          ) {
            addError(
              errors,
              "MARKETPLACE_ANTIGRAVITY_NAME_MISMATCH",
              marketplacePath,
              `Marketplace plugin "${entryName}" does not match .antigravity-plugin/plugin.json name "${agRead.data.name}" at "${source}"`,
            );
          }
          if (
            typeof entry.version === "string" &&
            typeof agRead.data.version === "string" &&
            agRead.data.version !== entry.version
          ) {
            addError(
              errors,
              "MARKETPLACE_ANTIGRAVITY_VERSION_MISMATCH",
              marketplacePath,
              `Marketplace plugin "${entryName ?? "unknown"}" version "${entry.version}" mismatches .antigravity-plugin/plugin.json version "${agRead.data.version}" at "${source}"`,
            );
          }
        }
      }
    } else if (isPlainObject(source)) {
      if (
        typeof source.source !== "string" ||
        !VALID_OBJECT_MARKETPLACE_SOURCES.has(source.source)
      ) {
        addError(
          errors,
          "MARKETPLACE_PLUGIN_INVALID_SOURCE",
          marketplacePath,
          `${entryLabel} ("${entryName ?? "unknown"}") object source must specify a valid "source" type`,
        );
      }
    } else {
      addError(
        errors,
        "MARKETPLACE_PLUGIN_MISSING_SOURCE",
        marketplacePath,
        `${entryLabel} ("${entryName ?? "unknown"}") requires a "source" path or object`,
      );
    }
  }

  return createResult(errors, warnings);
}

export function validateRepo(
  repoRoot: string,
  options?: ValidatorOptions,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isDirectory(repoRoot)) {
    addError(
      errors,
      "REPO_ROOT_NOT_FOUND",
      repoRoot,
      `Repository root "${repoRoot}" does not exist or is not a directory`,
    );
    return createResult(errors, warnings);
  }

  const marketplaceResult = validateMarketplace(repoRoot, options);
  mergeResults(errors, warnings, marketplaceResult);

  let realRepoRoot: string;
  try {
    realRepoRoot = fs.realpathSync(repoRoot);
  } catch {
    realRepoRoot = path.resolve(repoRoot);
  }

  const pluginDirsToValidate = new Map<string, string>();

  // Discover plugin directories referenced by .claude-plugin/marketplace.json
  const marketplacePath = path.join(
    repoRoot,
    ".claude-plugin",
    "marketplace.json",
  );
  if (isRegularFile(marketplacePath)) {
    const read = readJsonObject(marketplacePath, "MARKETPLACE");
    if (read.ok && Array.isArray(read.data.plugins)) {
      for (const entry of read.data.plugins) {
        if (
          !isPlainObject(entry) ||
          typeof entry.source !== "string" ||
          entry.source.includes("\\") ||
          entry.source.includes("..") ||
          (entry.source !== "." && !entry.source.startsWith("./"))
        ) {
          continue;
        }
        const candidate = path.resolve(realRepoRoot, entry.source);
        if (!isPathWithinRoot(realRepoRoot, candidate) || !isDirectory(candidate)) {
          continue;
        }
        const containment = checkExistingPathContainment(
          realRepoRoot,
          candidate,
        );
        if (containment.ok && containment.realPath !== undefined) {
          pluginDirsToValidate.set(containment.realPath, candidate);
        }
      }
    }
  }

  // Also discover any plugin directories under <repoRoot>/plugins/
  const pluginsRootDir = path.join(repoRoot, "plugins");
  if (isDirectory(pluginsRootDir)) {
    const pluginsRootContainment = checkExistingPathContainment(
      realRepoRoot,
      pluginsRootDir,
    );
    if (pluginsRootContainment.ok) {
      const entries = fs.readdirSync(pluginsRootDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) {
          continue;
        }
        const candidate = path.join(pluginsRootDir, entry.name);
        if (
          entry.isDirectory() ||
          (entry.isSymbolicLink() && isDirectory(candidate))
        ) {
          const containment = checkExistingPathContainment(
            realRepoRoot,
            candidate,
          );
          if (containment.ok && containment.realPath !== undefined) {
            pluginDirsToValidate.set(containment.realPath, candidate);
          }
        }
      }
    }
  }

  for (const pluginDir of pluginDirsToValidate.values()) {
    const pluginResult = validatePlugin(pluginDir, options);
    mergeResults(errors, warnings, pluginResult);
  }

  return createResult(errors, warnings);
}
