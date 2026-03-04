import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveBundledHooksDir(): string | undefined {
  const override = process.env.OPENCLAW_BUNDLED_HOOKS_DIR?.trim();
  if (override) {
    return override;
  }

  // 1. Resolve relative to this module (compiled hooks in dist/)
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    // If we're in dist/, look for bundled/ relative to us
    const distBundled = path.join(moduleDir, "bundled");
    if (fs.existsSync(distBundled)) {
      // Ensure it contains compiled .js handlers, not just HOOK.md
      const entries = fs.readdirSync(distBundled, { withFileTypes: true });
      if (entries.some((e) => e.isDirectory())) {
        return distBundled;
      }
    }
  } catch {
    // ignore
  }

  // 2. Resolve relative to process.execPath (compiled standalone binary)
  try {
    const execDir = path.dirname(process.execPath);
    const sibling = path.join(execDir, "hooks", "bundled");
    if (fs.existsSync(sibling)) {
      return sibling;
    }
  } catch {
    // ignore
  }

  // 3. Dev: resolve `<packageRoot>/src/hooks/bundled` if we're in dev mode or dist doesn't exist
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    // dist/hooks/bundled-dir.js -> ../../src/hooks/bundled
    const root = path.resolve(moduleDir, "..", "..");
    const srcBundled = path.join(root, "src", "hooks", "bundled");
    if (fs.existsSync(srcBundled)) {
      // Only return src if we're actually in a dev env (e.g. running via tsx or explicitly requested)
      const isDev = Boolean(
        process.env.OPENCLAW_DEV || process.env.TSGO_DEV || process.env.NODE_SKIP_PLATFORM_CHECK,
      );
      if (isDev) {
        return srcBundled;
      }
    }
  } catch {
    // ignore
  }

  return undefined;
}
