import { Habits } from "@/modules/habits/models/Habit.model.js";
import logger from "@/utils/logger.util.js";

export async function migrateHabitsGlobalFields() {
  try {
    // 1. Add missing fields to habits that never had them
    const r1 = await Habits.updateMany(
      { is_global: { $exists: false } },
      { $set: { is_global: false, created_by_admin: false } }
    );
    if (r1.modifiedCount > 0) {
      logger.info({ action: "migrate-habits-global-fields", count: r1.modifiedCount }, "Added is_global/created_by_admin to existing habits");
    }

    // 2. Global habits must always be visible to everyone
    const r2 = await Habits.updateMany(
      { is_global: true, visible_pour_tous: { $ne: true } },
      { $set: { visible_pour_tous: true } }
    );
    if (r2.modifiedCount > 0) {
      logger.info({ action: "migrate-habits-global-visible", count: r2.modifiedCount }, "Set visible_pour_tous=true on existing global habits");
    }
  } catch (err) {
    logger.error({ err }, "migrateHabitsGlobalFields failed");
  }
}
