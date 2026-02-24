const Onboarding = require("../models/Onboarding");

async function routes(fastify) {

  fastify.post("/onboarding", async (req, reply) => {
    try {
      const onboarding = await Onboarding.create(req.body);
      reply.code(201);
      return onboarding;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.get("/onboarding", async (req, reply) => {
    try {
      const allOnboarding = await Onboarding.find().populate("utilisateur_id");
      return allOnboarding;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/onboarding/:id", async (req, reply) => {
    try {
      const onboarding = await Onboarding.findById(req.params.id).populate("utilisateur_id");
      if (!onboarding) {
        reply.code(404);
        return { error: "Onboarding not found" };
      }
      return onboarding;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.put("/onboarding/:id", async (req, reply) => {
    try {
      const onboarding = await Onboarding.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!onboarding) {
        reply.code(404);
        return { error: "Onboarding not found" };
      }
      return onboarding;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.delete("/onboarding/:id", async (req, reply) => {
    try {
      const onboarding = await Onboarding.findByIdAndDelete(req.params.id);
      if (!onboarding) {
        reply.code(404);
        return { error: "Onboarding not found" };
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

