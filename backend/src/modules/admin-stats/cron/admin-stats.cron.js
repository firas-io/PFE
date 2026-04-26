import cron              from "node-cron";
import AdminStatsService from "../services/admin-stats.service.js";
import logger            from "@/utils/logger.util.js";

/** Runs every Monday at 01:00 — generates anonymised weekly stats. */
export function startAdminStatsCron() {
  cron.schedule("0 1 * * 1", async () => {
    logger.info("Admin stats cron starting...");
    try {
      await AdminStatsService.generate();
      logger.info("Admin stats cron finished");
    } catch (err) {
      logger.error({ err }, "Admin stats cron error");
    }
  });

  logger.info("Admin stats cron scheduled (Mondays 01:00)");
}
