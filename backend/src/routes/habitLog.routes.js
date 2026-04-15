/**
 * habitLog.routes.js
 * Habit log CRUD, catch-up, and incomplete-date query endpoints.
 */
const controller = require("../controllers/habitLog.controller");

async function routes(fastify) {
  fastify.post("/logs", { preHandler: [fastify.authenticate] }, controller.createLog);
  fastify.get("/logs", { preHandler: [fastify.authenticate, fastify.authorize(["LOGS_VIEW"])] }, controller.getAllLogs);

  // Specific routes BEFORE parameterized ones
  fastify.post("/logs/catchup", { preHandler: [fastify.authenticate] }, controller.catchupLog);
  fastify.get("/logs/incomplete-for-date/:date", { preHandler: [fastify.authenticate] }, controller.getIncompleteForDate);

  fastify.get("/logs/:id", { preHandler: [fastify.authenticate] }, controller.getLogById);
  fastify.put("/logs/:id", { preHandler: [fastify.authenticate] }, controller.updateLog);
  fastify.delete("/logs/:id", { preHandler: [fastify.authenticate] }, controller.deleteLog);
}

module.exports = routes;
