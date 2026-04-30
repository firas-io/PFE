import WeeklyStatsController from "../controllers/weekly-stats.controller.js";

export default async function weeklyStatsRoutes(fastify) {
  // Admin only — requires ADMIN_STATS_VIEW (or ALL)
  fastify.route({
    method:     "GET",
    url:        "/stats/admin",
    preHandler: fastify.auth([
      fastify.verifyAccessToken,
      fastify.verifyAbility([{ action: "read", subject: "AdminStats" }]),
    ]),
    handler: WeeklyStatsController.getAdminStats,
  });

  // Manager only — requires MANAGER_USERS_VIEW
  fastify.route({
    method:     "GET",
    url:        "/stats/manager",
    preHandler: fastify.auth([
      fastify.verifyAccessToken,
      fastify.verifyAbility([{ action: "read", subject: "ManagerUser" }]),
    ]),
    handler: WeeklyStatsController.getManagerStats,
  });

  // Any authenticated user — own data only
  fastify.route({
    method:     "GET",
    url:        "/stats/user",
    preHandler: fastify.auth([fastify.verifyAccessToken]),
    handler:    WeeklyStatsController.getUserStats,
  });
}
