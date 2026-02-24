const Session = require("../models/Session");

async function routes(fastify) {

  fastify.post("/sessions", async (req, reply) => {
    try {
      const session = await Session.create(req.body);
      reply.code(201);
      return session;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.get("/sessions", async (req, reply) => {
    try {
      const sessions = await Session.find().populate("utilisateur_id");
      return sessions;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/sessions/:id", async (req, reply) => {
    try {
      const session = await Session.findById(req.params.id).populate("utilisateur_id");
      if (!session) {
        reply.code(404);
        return { error: "Session not found" };
      }
      return session;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.delete("/sessions/:id", async (req, reply) => {
    try {
      const session = await Session.findByIdAndDelete(req.params.id);
      if (!session) {
        reply.code(404);
        return { error: "Session not found" };
      }
      reply.code(204);
      return null;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

}

module.exports = routes;
