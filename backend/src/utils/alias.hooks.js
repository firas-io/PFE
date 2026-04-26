import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const __filename = fileURLToPath(import.meta.url);
// This file lives at src/utils/alias.hooks.js → SRC_DIR is src/
const SRC_DIR = resolvePath(dirname(__filename), "..");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const relativePath = specifier.slice(2);
    const absolutePath = resolvePath(SRC_DIR, relativePath);
    return nextResolve(pathToFileURL(absolutePath).href, context);
  }
  return nextResolve(specifier, context);
}
