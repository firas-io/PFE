/**
 * progress.routes.js
 * User progress, today view, and calendar endpoints.
 */
const controller = require("../controllers/progress.controller");

async function routes(fastify) {
  fastify.get("/progress/my", { preHandler: [fastify.authenticate] }, controller.getMyProgress);
  fastify.get("/progress/today", { preHandler: [fastify.authenticate] }, controller.getToday);
  fastify.get("/progress/calendar", { preHandler: [fastify.authenticate] }, controller.getCalendar);
}

module.exports = routes;
