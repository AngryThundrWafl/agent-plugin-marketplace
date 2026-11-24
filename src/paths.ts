import fs from "node:fs";
import path from "node:path";

export function isPathWithinRoot(rootDir: string, targetPath: string): boolean {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative === "") {
    return true;
  }
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

export interface ContainedPathCheck {
  ok: boolean;
  reason?: string;
  realPath?: string;
}

export function checkExistingPathContainment(
  rootDir: string,
  targetPath: string,
): ContainedPathCheck {
  let realRoot: string;
  try {
    realRoot = fs.realpathSync(rootDir);
  } catch {
    return {
      ok: false,
      reason: `Root directory "${rootDir}" cannot be resolved`,
    };
  }

  let realTarget: string;
  try {
    realTarget = fs.realpathSync(targetPath);
  } catch {
    return {
      ok: false,
      reason: `Path "${targetPath}" cannot be resolved on filesystem`,
    };
  }

  if (!isPathWithinRoot(realRoot, realTarget)) {
    return {
      ok: false,
      reason: `Path "${targetPath}" resolves to "${realTarget}", which escapes root "${realRoot}"`,
    };
  }

  return { ok: true, realPath: realTarget };
}

export function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized === "[::1]"
  ) {
    return true;
  }
  return /^127\.(?:25[0-5]|2[0-4]\d|1?\d?\d)\.(?:25[0-5]|2[0-4]\d|1?\d?\d)\.(?:25[0-5]|2[0-4]\d|1?\d?\d)$/.test(
    normalized,
  );
}

export function extractAgentPluginsSchemaVersion(
  schemaUrl: string,
): string | undefined {
  const match =
    /^https:\/\/agent-plugins\.org\/schemas\/([^/]+)\/(?:plugin|mcp)\.schema\.json$/.exec(
      schemaUrl,
    );
  return match?.[1];
}

export function checkLexicalRelativeContainment(relPosixPath: string): boolean {
  if (relPosixPath.includes("\\")) {
    return false;
  }
  const normalized = path.posix.normalize(relPosixPath);
  if (
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.startsWith("/")
  ) {
    return false;
  }
  return true;
}

export function checkTargetIfExistsContainment(
  realRoot: string,
  resolvedTarget: string,
): ContainedPathCheck {
  if (!isPathWithinRoot(realRoot, resolvedTarget)) {
    return {
      ok: false,
      reason: `Path "${resolvedTarget}" escapes root "${realRoot}"`,
    };
  }

  let stat: fs.Stats | undefined;
  try {
    stat = fs.lstatSync(resolvedTarget);
  } catch {
    // Target does not exist on disk; lexical containment already verified.
    return { ok: true };
  }

  if (stat.isSymbolicLink()) {
    try {
      const realTarget = fs.realpathSync(resolvedTarget);
      if (!isPathWithinRoot(realRoot, realTarget)) {
        return {
          ok: false,
          reason: `Symlink "${resolvedTarget}" resolves to "${realTarget}", escaping root "${realRoot}"`,
        };
      }
      return { ok: true, realPath: realTarget };
    } catch {
      return {
        ok: false,
        reason: `Symlink "${resolvedTarget}" cannot be resolved within root "${realRoot}"`,
      };
    }
  }

  try {
    const realTarget = fs.realpathSync(resolvedTarget);
    if (!isPathWithinRoot(realRoot, realTarget)) {
      return {
        ok: false,
        reason: `Path "${resolvedTarget}" resolves to "${realTarget}", escaping root "${realRoot}"`,
      };
    }
    return { ok: true, realPath: realTarget };
  } catch {
    return { ok: true };
  }
}
