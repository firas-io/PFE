/**
 * auth.routes.js
 * Authentication endpoints: register, login, LDAP login, profile.
 */
const controller = require("../controllers/auth.controller");

async function routes(fastify) {
  fastify.post("/register", controller.register);
  fastify.post("/login", controller.login);
  fastify.post("/login/ldap", controller.loginLdap);

  fastify.get("/profile", { preHandler: [fastify.authenticate] }, controller.getProfile);
}

module.exports = routes;
