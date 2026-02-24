const Habit = require("../models/Habit");

async function routes(fastify) {

  fastify.post("/habits", async (req, reply) => {
    try {
      if (!req.body.utilisateur_id || !req.body.nom) {
        reply.code(400);
        return { error: "utilisateur_id and nom are required" };
      }
      const habit = await Habit.create(req.body);
      reply.code(201);
      return habit;
    } catch(err) {
      reply.code(400);
      return { error: err.message };  
    }
  });

  fastify.get("/habits", async (req, reply) => {
    try {
      const habits = await Habit.find().populate("utilisateur_id");
      return habits;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/habits/:id", async (req, reply) => {
    try {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        reply.code(400);
        return { error: "Invalid habit ID" };
      }
      const habit = await Habit.findById(req.params.id).populate("utilisateur_id");
      if (!habit) {
        reply.code(404);
        return { error: "Habit not found" };
      }
      return habit;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.put("/habits/:id", async (req, reply) => {
    try {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        reply.code(400);
        return { error: "Invalid habit ID" };
      }
      const habit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!habit) {
        reply.code(404);
        return { error: "Habit not found" };
      }
      return habit;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.delete("/habits/:id", async (req, reply) => {
    try {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        reply.code(400);
        return { error: "Invalid habit ID" };
      }
      const habit = await Habit.findByIdAndDelete(req.params.id);
      if (!habit) {
        reply.code(404);
        return { error: "Habit not found" };
      }
      reply.code(204);
      return null;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/habits/user/:userId", async (req, reply) => {
    try {
      if (!req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
        reply.code(400);
        return { error: "Invalid user ID" };
      }
      const habits = await Habit.find({ utilisateur_id: req.params.userId }).populate("utilisateur_id");
      return habits;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

}

module.exports = routes;
