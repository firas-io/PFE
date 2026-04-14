const controller = require("../controllers/authentificationControllers");

async function routes(fastify) {

  fastify.post("/register", controller.register);
  fastify.post("/login", controller.login);
  fastify.post("/login/ldap", controller.loginLdap);

  // Exemple route protégée
  fastify.get("/profile", {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    return request.user;
  });
}

module.exports = routes;