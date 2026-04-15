/**
 * user.routes.js
 * User management endpoints.
 */
const controller = require("../controllers/user.controller");

async function routes(fastify) {
  fastify.post("/users", controller.createUser);
  fastify.get("/users", { preHandler: [fastify.authenticate, fastify.authorize(["USERS_VIEW"])] }, controller.getUsers);
  fastify.get("/users/:id", { preHandler: [fastify.authenticate] }, controller.getUserById);
  fastify.patch("/users/:id/role", { preHandler: [fastify.authenticate, fastify.authorize(["USERS_MANAGE"])] }, controller.updateUserRole);
  fastify.patch("/users/:id/status", { preHandler: [fastify.authenticate, fastify.authorize(["USERS_MANAGE"])] }, controller.updateUserStatus);
  fastify.delete("/users/:id", { preHandler: [fastify.authenticate] }, controller.deleteUser);
  fastify.post("/users/admin", { preHandler: [fastify.authenticate, fastify.authorize(["USERS_MANAGE"])] }, controller.adminCreateUser);
  fastify.patch("/users/:id", { preHandler: [fastify.authenticate] }, controller.updateUser);
  fastify.put("/users/:id", { preHandler: [fastify.authenticate] }, controller.updateUser); // Frontend compatibility
}

module.exports = routes;
