/**
 * habitStats.routes.js
 * Habit statistics endpoints.
 */
const controller = require("../controllers/habitStats.controller");

async function routes(fastify) {
  fastify.post("/stats", { preHandler: [fastify.authenticate, fastify.authorize(["STATS_MANAGE"])] }, controller.createStats);
  fastify.get("/stats", { preHandler: [fastify.authenticate, fastify.authorize(["STATS_VIEW"])] }, controller.getAllStats);
  fastify.get("/stats/habit/:habitId", { preHandler: [fastify.authenticate] }, controller.getStatsByHabit);
  fastify.get("/stats/:id", { preHandler: [fastify.authenticate] }, controller.getStatsById);
}

module.exports = routes;
