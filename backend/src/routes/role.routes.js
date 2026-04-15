/**
 * role.routes.js
 * Role management endpoints.
 */
const controller = require("../controllers/role.controller");

async function routes(fastify) {
  fastify.get("/roles", { preHandler: [fastify.authenticate, fastify.authorize(["ROLES_VIEW"])] }, controller.getRoles);
  fastify.post("/roles", { preHandler: [fastify.authenticate, fastify.authorize(["ROLES_MANAGE"])] }, controller.createRole);
  fastify.put("/roles/:id", { preHandler: [fastify.authenticate, fastify.authorize(["ROLES_MANAGE"])] }, controller.updateRole);
  fastify.delete("/roles/:id", { preHandler: [fastify.authenticate, fastify.authorize(["ROLES_MANAGE"])] }, controller.deleteRole);
}

module.exports = routes;
