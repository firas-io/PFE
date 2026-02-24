const HabitStats = require("../models/HabitStats");

async function routes(fastify) {

  fastify.post("/stats", async (req, reply) => {
    try {
      if (!req.body.habit_id) {
        reply.code(400);
        return { error: "habit_id is required" };
      }
      const stats = await HabitStats.create(req.body);
      reply.code(201);
      return stats;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.get("/stats", async (req, reply) => {
    try {
      const allStats = await HabitStats.find().populate("habit_id");
      return allStats;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/stats/:id", async (req, reply) => {
    try {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        reply.code(400);
        return { error: "Invalid stats ID" };
      }
      const stats = await HabitStats.findById(req.params.id).populate("habit_id");
      if (!stats) {
        reply.code(404);
        return { error: "Stats not found" };
      }
      return stats;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.put("/stats/:id", async (req, reply) => {
    try {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        reply.code(400);
        return { error: "Invalid stats ID" };
      }
      const stats = await HabitStats.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!stats) {
        reply.code(404);
        return { error: "Stats not found" };
      }
      return stats;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.delete("/stats/:id", async (req, reply) => {
    try {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        reply.code(400);
        return { error: "Invalid stats ID" };
      }
      const stats = await HabitStats.findByIdAndDelete(req.params.id);
      if (!stats) {
        reply.code(404);
        return { error: "Stats not found" };
      }
      reply.code(204);
      return null;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/stats/habit/:habitId", async (req, reply) => {
    try {
      if (!req.params.habitId.match(/^[0-9a-fA-F]{24}$/)) {
        reply.code(400);
        return { error: "Invalid habit ID" };
      }
      const stats = await HabitStats.findOne({ habit_id: req.params.habitId }).populate("habit_id");
      if (!stats) {
        reply.code(404);
        return { error: "Stats not found for this habit" };
      }
      return stats;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

}

module.exports = routes;
