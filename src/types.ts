export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  file: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidatorOptions {
  schemasDir?: string;
}

export function createResult(
  errors: ValidationIssue[] = [],
  warnings: ValidationIssue[] = [],
): ValidationResult {
  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function addError(
  errors: ValidationIssue[],
  code: string,
  file: string,
  message: string,
): void {
  errors.push({
    severity: "error",
    code,
    file,
    message,
  });
}

export function addWarning(
  warnings: ValidationIssue[],
  code: string,
  file: string,
  message: string,
): void {
  warnings.push({
    severity: "warning",
    code,
    file,
    message,
  });
}

export function mergeResults(
  targetErrors: ValidationIssue[],
  targetWarnings: ValidationIssue[],
  source: ValidationResult,
): void {
  targetErrors.push(...source.errors);
  targetWarnings.push(...source.warnings);
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
