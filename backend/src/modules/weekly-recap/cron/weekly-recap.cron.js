import cron               from "node-cron";
import WeeklyRecapService from "../services/weekly-recap.service.js";
import logger             from "@/utils/logger.util.js";

/** Runs every Sunday at 22:00 — generates weekly recaps for all active users. */
export function startWeeklyRecapCron() {
  cron.schedule("0 22 * * 0", async () => {
    logger.info("Weekly recap cron starting...");
    try {
      const created = await WeeklyRecapService.generateForAllUsers();
      logger.info({ created }, "Weekly recap cron finished");
    } catch (err) {
      logger.error({ err }, "Weekly recap cron error");
    }
  });

  logger.info("Weekly recap cron scheduled (Sundays 22:00)");
}
