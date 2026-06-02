/**
 * Migration : user.categories[] → user_category_preferences collection
 * Exécuté au démarrage une seule fois — idempotent.
 */
import { Users }                   from "@/modules/users/models/User.model.js";
import { UserCategoryPreferences } from "@/modules/users/models/UserCategoryPreference.model.js";
import logger                      from "@/utils/logger.util.js";

export async function migrateCategoriesToPreferences() {
  const users = await Users.find({ categories: { $exists: true, $not: { $size: 0 } } });
  if (!users.length) return;

  let migrated = 0;
  for (const user of users) {
    const slugs = Array.isArray(user.categories) ? user.categories : [];
    for (const slug of slugs) {
      if (!slug) continue;
      const exists = await UserCategoryPreferences.findByUserAndSlug(String(user._id), slug);
      if (!exists) {
        await UserCategoryPreferences.insertOne({
          user_id:       String(user._id),
          category_slug: slug,
          created_at:    user.createdAt ?? new Date(),
        });
        migrated++;
      }
    }
  }

  if (migrated > 0)
    logger.info({ action: "migrate-categories-to-preferences", migrated }, "User categories migrated to user_category_preferences");
}
