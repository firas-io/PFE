const Onboarding = require("../models/Onboarding");

async function routes(fastify) {

  // POST /onboarding — Authentifié (Propriétaire)
  fastify.post("/onboarding", {
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
    try {
      const onboardingData = { ...req.body, utilisateur_id: req.user.id };
      const onboarding = await Onboarding.create(onboardingData);
      reply.code(201);
      return onboarding;
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // GET /onboarding — RÉSERVÉ AUX ADMINS (Permission: ONBOARDING_VIEW)
  fastify.get("/onboarding", {
    preHandler: [fastify.authenticate, fastify.authorize(["ONBOARDING_VIEW"])]
  }, async (req, reply) => {
    try {
      const allOnboarding = await Onboarding.find().populate("utilisateur_id", "-mot_de_passe");
      return allOnboarding;
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // GET /onboarding/:id — Propriétaire ou Admin
  fastify.get("/onboarding/:id", {
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
    try {
      const onboarding = await Onboarding.findById(req.params.id).populate("utilisateur_id", "-mot_de_passe");
      if (!onboarding) {
        reply.code(404);
        return { error: "Onboarding not found" };
      }

      const isAdmin = req.user.permissions.includes("ONBOARDING_VIEW") || req.user.permissions.includes("ALL");
      if (onboarding.utilisateur_id._id.toString() !== req.user.id && !isAdmin) {
        reply.code(403);
        return { error: "Accès refusé" };
      }

      return onboarding;
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // PUT /onboarding/:id — Propriétaire ou Admin
  fastify.put("/onboarding/:id", {
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
    try {
      const onboarding = await Onboarding.findById(req.params.id);
      if (!onboarding) {
        reply.code(404);
        return { error: "Onboarding not found" };
      }

      const isAdmin = req.user.permissions.includes("ONBOARDING_MANAGE") || req.user.permissions.includes("ALL");
      if (onboarding.utilisateur_id.toString() !== req.user.id && !isAdmin) {
        reply.code(403);
        return { error: "Accès refusé" };
      }

      const updatedOnboarding = await Onboarding.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return updatedOnboarding;
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });
}

module.exports = routes;
