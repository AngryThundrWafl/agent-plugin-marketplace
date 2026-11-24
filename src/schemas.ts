import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Ajv2020,
  type ErrorObject,
  type SchemaObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";
import { isPlainObject, type ValidationIssue } from "./types.js";

export interface CompiledSchemas {
  plugin: ValidateFunction;
  mcpTopLevel: ValidateFunction;
  mcpServer: ValidateFunction;
  mcpStdioServer: ValidateFunction;
  mcpStreamableHttpServer: ValidateFunction;
  mcpSseServer: ValidateFunction;
  antigravityPlugin: ValidateFunction;
}

const DEFAULT_SCHEMAS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "schemas",
);

const schemaCache = new Map<string, CompiledSchemas>();

export function resolveSchemasDir(override?: string): string {
  return override ? path.resolve(override) : DEFAULT_SCHEMAS_DIR;
}

function loadSchemaFile(filePath: string): SchemaObject {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!isPlainObject(parsed)) {
    throw new Error(`Schema file "${filePath}" must contain a JSON object`);
  }
  return parsed as SchemaObject;
}

export function getCompiledSchemas(schemasDirOverride?: string): CompiledSchemas {
  const schemasDir = resolveSchemasDir(schemasDirOverride);
  const cached = schemaCache.get(schemasDir);
  if (cached !== undefined) {
    return cached;
  }

  const ajv = new Ajv2020({ allErrors: true, strict: false });

  const pluginSchema = loadSchemaFile(
    path.join(schemasDir, "agent-plugins", "1.0.0", "plugin.schema.json"),
  );
  const mcpSchema = loadSchemaFile(
    path.join(schemasDir, "agent-plugins", "1.0.0", "mcp.schema.json"),
  );
  const antigravitySchema = loadSchemaFile(
    path.join(schemasDir, "antigravity", "v1", "plugin.json"),
  );

  const plugin = ajv.compile(pluginSchema);

  const mcpId =
    typeof mcpSchema.$id === "string"
      ? mcpSchema.$id
      : "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
  ajv.addSchema(mcpSchema, mcpId);

  const rawProps = isPlainObject(mcpSchema.properties)
    ? { ...mcpSchema.properties }
    : {};
  rawProps.mcpServers = { type: "object" };

  const mcpTopLevelSchema: SchemaObject = {
    $schema: mcpSchema.$schema,
    type: "object",
    properties: rawProps,
    required: Array.isArray(mcpSchema.required)
      ? mcpSchema.required
      : ["$schema", "mcpServers"],
    additionalProperties: false,
  };

  const mcpTopLevel = ajv.compile(mcpTopLevelSchema);
  const mcpServer = ajv.compile({ $ref: `${mcpId}#/$defs/server` });
  const mcpStdioServer = ajv.compile({ $ref: `${mcpId}#/$defs/stdioServer` });
  const mcpStreamableHttpServer = ajv.compile({
    $ref: `${mcpId}#/$defs/streamableHttpServer`,
  });
  const mcpSseServer = ajv.compile({ $ref: `${mcpId}#/$defs/sseServer` });
  const antigravityPlugin = ajv.compile(antigravitySchema);

  const compiled: CompiledSchemas = {
    plugin,
    mcpTopLevel,
    mcpServer,
    mcpStdioServer,
    mcpStreamableHttpServer,
    mcpSseServer,
    antigravityPlugin,
  };

  schemaCache.set(schemasDir, compiled);
  return compiled;
}

function formatErrorDetail(err: ErrorObject): string {
  const baseMessage = err.message ?? `failed "${err.keyword}" validation`;
  const params = isPlainObject(err.params) ? err.params : {};

  switch (err.keyword) {
    case "additionalProperties": {
      const prop = params.additionalProperty;
      if (typeof prop === "string") {
        return `${baseMessage} (unexpected property "${prop}")`;
      }
      return baseMessage;
    }
    case "required": {
      const prop = params.missingProperty;
      if (typeof prop === "string") {
        return `${baseMessage} (missing required property "${prop}")`;
      }
      return baseMessage;
    }
    case "propertyNames": {
      const prop =
        typeof err.propertyName === "string"
          ? err.propertyName
          : typeof params.propertyName === "string"
            ? params.propertyName
            : undefined;
      if (prop !== undefined) {
        return `${baseMessage} (invalid property name "${prop}")`;
      }
      return baseMessage;
    }
    case "const": {
      if ("allowedValue" in params) {
        return `${baseMessage} (expected ${JSON.stringify(params.allowedValue)})`;
      }
      return baseMessage;
    }
    case "enum": {
      if (Array.isArray(params.allowedValues)) {
        return `${baseMessage} (allowed: ${params.allowedValues
          .map((v) => JSON.stringify(v))
          .join(", ")})`;
      }
      return baseMessage;
    }
    default:
      return baseMessage;
  }
}

export function ajvErrorsToIssues(
  ajvErrors: ErrorObject[] | null | undefined,
  file: string,
  code: string,
  contextPrefix?: string,
): ValidationIssue[] {
  if (!ajvErrors || ajvErrors.length === 0) {
    return [];
  }

  return ajvErrors.map((err) => {
    const location =
      err.instancePath && err.instancePath.length > 0
        ? err.instancePath
        : "<root>";
    const prefix = contextPrefix ? `${contextPrefix} ` : "";
    return {
      severity: "error",
      code,
      file,
      message: `${prefix}${location}: ${formatErrorDetail(err)}`,
    };
  });
}
