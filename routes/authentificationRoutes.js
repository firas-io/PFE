const controller = require("../controllers/authController");

async function routes(fastify) {

  fastify.post("/register", controller.register);

  fastify.post("/login", controller.login);

  // Exemple route protégée
  fastify.get("/profile", {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    return request.user;
  });
}

module.exports = routes;