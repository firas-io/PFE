import { RefreshTokens } from "@/modules/auth/models/RefreshToken.model.js";
import { UserHabitSettings } from "@/modules/habits/models/UserHabitSettings.model.js";
import logger from "@/utils/logger.util.js";

export async function setupIndexes() {
  try {
    // Unique lookup by hash (used on every /refresh and /logout)
    await RefreshTokens.createIndex({ token_hash: 1 }, { unique: true, name: "idx_refresh_token_hash" });

    // Fast revocation queries per user
    await RefreshTokens.createIndex({ user_id: 1, revoked_at: 1 }, { name: "idx_refresh_user_revoked" });

    // MongoDB TTL — auto-delete expired tokens (runs every 60 s by default)
    await RefreshTokens.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0, name: "idx_refresh_ttl" });

    // Unique constraint: one settings doc per user+habit
    await UserHabitSettings.createIndex({ user_id: 1, habit_id: 1 }, { unique: true, name: "idx_user_habit_settings_unique" });

    logger.info("MongoDB indexes ensured for refresh_tokens, user_habit_settings");
  } catch (err) {
    logger.error({ err }, "Failed to create indexes");
    // Non-fatal: indexes are for performance/TTL — server can still start
  }
}
