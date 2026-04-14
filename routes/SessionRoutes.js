const Session = require("../models/Session");

async function routes(fastify) {

  // POST /sessions — Authentifié (Propriétaire)
  fastify.post("/sessions", {
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
    try {
      const sessionData = { ...req.body, utilisateur_id: req.user.id };
      const session = await Session.create(sessionData);
      reply.code(201);
      return session;
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // GET /sessions — RÉSERVÉ AUX ADMINS (Permission: SESSIONS_VIEW)
  fastify.get("/sessions", {
    preHandler: [fastify.authenticate, fastify.authorize(["SESSIONS_VIEW"])]
  }, async (req, reply) => {
    try {
      const sessions = await Session.find().populate("utilisateur_id", "-mot_de_passe");
      return sessions;
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // DELETE /sessions/:id — Propriétaire ou Admin
  fastify.delete("/sessions/:id", {
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
    try {
      const session = await Session.findById(req.params.id);
      if (!session) {
        reply.code(404);
        return { error: "Session not found" };
      }

      const isAdmin = req.user.permissions.includes("SESSIONS_MANAGE") || req.user.permissions.includes("ALL");
      if (session.utilisateur_id.toString() !== req.user.id && !isAdmin) {
        reply.code(403);
        return { error: "Accès refusé" };
      }

      await Session.findByIdAndDelete(req.params.id);
      reply.code(204);
      return null;
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });
}

module.exports = routes;
