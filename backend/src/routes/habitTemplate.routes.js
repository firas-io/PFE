/**
 * habitTemplate.routes.js
 * Habit template endpoints.
 */
const controller = require("../controllers/habitTemplate.controller");

async function routes(fastify) {
  fastify.get("/habits/templates", { preHandler: [fastify.authenticate] }, controller.getTemplates);
  fastify.post("/habits/from-template/:templateId", { preHandler: [fastify.authenticate] }, controller.createFromTemplate);
}

module.exports = routes;
