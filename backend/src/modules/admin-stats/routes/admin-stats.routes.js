import AdminStatsController from "../controllers/admin-stats.controller.js";

const getLast12Weeks = (s) => ({
  method:     "GET",
  url:        "/admin/stats",
  preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read", subject: "Stats" }])]),
  handler:    AdminStatsController.getLast12Weeks,
});

const routes = [getLast12Weeks];

export default async function adminStatsRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
