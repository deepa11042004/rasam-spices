// Minimal ESM loader: resolves extensionless imports to .ts files
// for use with Node's --experimental-strip-types
import { stat } from "node:fs/promises";
import { resolve as pathResolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  // Only handle relative imports without extensions
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const hasExt = /\.\w+$/.test(specifier);
    if (!hasExt) {
      // Resolve relative to the parent module
      const parentPath = context.parentURL
        ? fileURLToPath(context.parentURL)
        : process.cwd();
      const parentDir = context.parentURL
        ? dirname(parentPath)
        : parentPath;
      const candidate = pathResolve(parentDir, specifier + ".ts");
      try {
        await stat(candidate);
        return nextResolve(specifier + ".ts", context);
      } catch {
        // Fall through to default resolution
      }
    }
  }
  return nextResolve(specifier, context);
}
