/**
 * session.routes.js
 * Session endpoints.
 */
const controller = require("../controllers/session.controller");

async function routes(fastify) {
  fastify.post("/sessions", { preHandler: [fastify.authenticate] }, controller.createSession);
  fastify.get("/sessions", { preHandler: [fastify.authenticate, fastify.authorize(["SESSIONS_VIEW"])] }, controller.getSessions);
  fastify.delete("/sessions/:id", { preHandler: [fastify.authenticate] }, controller.deleteSession);
}

module.exports = routes;
