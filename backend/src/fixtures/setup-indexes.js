import { UserHabitSettings }        from "@/modules/habits/models/UserHabitSettings.model.js";
import { UserCategoryPreferences }  from "@/modules/users/models/UserCategoryPreference.model.js";
import logger from "@/utils/logger.util.js";

export async function setupIndexes() {
  try {
    // Unique constraint: one settings doc per user+habit
    await UserHabitSettings.createIndex({ user_id: 1, habit_id: 1 }, { unique: true, name: "idx_user_habit_settings_unique" });

    // Fast lookup: all category prefs for a user
    await UserCategoryPreferences.createIndex({ user_id: 1 }, { name: "idx_user_category_prefs_user" });

    // Unique constraint: one pref per user+slug
    await UserCategoryPreferences.createIndex({ user_id: 1, category_slug: 1 }, { unique: true, name: "idx_user_category_prefs_unique" });

    logger.info("MongoDB indexes ensured for user_habit_settings, user_category_preferences");
  } catch (err) {
    logger.error({ err }, "Failed to create indexes");
  }
}
