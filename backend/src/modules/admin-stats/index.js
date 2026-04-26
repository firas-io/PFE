import autoload               from "@fastify/autoload";
import { fileURLToPath }       from "url";
import loadCommonSchemas       from "./validations/index.js";
import { startAdminStatsCron } from "./cron/admin-stats.cron.js";

const routesDir = fileURLToPath(new URL("./routes", import.meta.url));

export default async function adminStatsModule(app) {
  loadCommonSchemas(app);
  app.register(autoload, { dir: routesDir, ignorePattern: /.*\.test\.js$/ });
  startAdminStatsCron();
}
