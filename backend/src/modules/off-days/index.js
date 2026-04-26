import autoload          from "@fastify/autoload";
import { fileURLToPath }  from "url";
import loadCommonSchemas  from "./validations/index.js";

const routesDir = fileURLToPath(new URL("./routes", import.meta.url));

export default async function offDaysModule(app) {
  loadCommonSchemas(app);
  app.register(autoload, { dir: routesDir, ignorePattern: /.*\.test\.js$/ });
}
