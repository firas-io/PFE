import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

register("./utils/alias.hooks.js", pathToFileURL(join(__dirname, "/")));
