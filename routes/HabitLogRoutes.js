const HabitLog = require("../models/HabitLog");

async function routes(fastify) {

  fastify.post("/logs", async (req, reply) => {
    try {
      const log = await HabitLog.create(req.body);
      reply.code(201);
      return log;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.get("/logs", async (req, reply) => {
    try {
      const logs = await HabitLog.find().populate("habit_id");
      return logs;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/logs/:id", async (req, reply) => {
    try {
      const log = await HabitLog.findById(req.params.id).populate("habit_id");
      if (!log) {
        reply.code(404);
        return { error: "Log not found" };
      }
      return log;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.put("/logs/:id", async (req, reply) => {
    try {
      const log = await HabitLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!log) {
        reply.code(404);
        return { error: "Log not found" };
      }
      return log;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.delete("/logs/:id", async (req, reply) => {
    try {
      const log = await HabitLog.findByIdAndDelete(req.params.id);
      if (!log) {
        reply.code(404);
        return { error: "Log not found" };
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
