#!/usr/bin/env node
import path from "node:path";
import { validateRepo, type ValidationIssue } from "./validator.js";

function formatIssue(issue: ValidationIssue, baseDir: string): string {
  const relFile = path.relative(baseDir, issue.file) || issue.file;
  const displayFile = relFile.startsWith("..") ? issue.file : relFile;
  return `  [${issue.severity.toUpperCase()}] ${issue.code} (${displayFile}): ${issue.message}`;
}

function main(): void {
  const rawArg = process.argv[2];
  const targetPath = path.resolve(rawArg ?? process.cwd());
  const result = validateRepo(targetPath);

  if (result.warnings.length > 0) {
    console.warn(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      console.warn(formatIssue(warning, targetPath));
    }
  }

  if (result.errors.length > 0) {
    console.error(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      console.error(formatIssue(error, targetPath));
    }
  }

  const status = result.ok ? "PASS" : "FAIL";
  console.log(
    `Validation ${status} for ${targetPath}: ${result.errors.length} error(s), ${result.warnings.length} warning(s).`,
  );

  process.exitCode = result.ok ? 0 : 1;
}

try {
  main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Validation failed with unexpected error: ${message}`);
  process.exitCode = 1;
}
