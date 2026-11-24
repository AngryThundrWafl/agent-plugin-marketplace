import type { ValidationIssue } from "./types.js";

export const SECRET_KEY_PATTERN = /secret|token|password|api_key|credential/i;
const SAFE_PLACEHOLDER_PATTERN = /^\$\{[A-Za-z_][A-Za-z0-9_]*\}$/;

export function isSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key);
}

export function isSafeSecretValue(value: string): boolean {
  if (value === "") {
    return true;
  }
  const lower = value.toLowerCase();
  if (lower === "changeme" || lower === "example") {
    return true;
  }
  return SAFE_PLACEHOLDER_PATTERN.test(value);
}

export function checkSecretsInObject(
  obj: Record<string, unknown>,
  contextFile: string,
  fieldPrefix: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (!isSecretKey(key)) {
      continue;
    }
    if (typeof value !== "string") {
      continue;
    }
    if (!isSafeSecretValue(value)) {
      issues.push({
        severity: "error",
        code: "SECRET_HARDCODED",
        file: contextFile,
        message: `Potential hardcoded secret in ${fieldPrefix}.${key}: secret-like keys must use "", "changeme", "example", or a \${VAR} placeholder`,
      });
    }
  }

  return issues;
}
