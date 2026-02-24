const Reminder = require("../models/Reminder");

async function routes(fastify) {

  fastify.post("/reminders", async (req, reply) => {
    try {
      const reminder = await Reminder.create(req.body);
      reply.code(201);
      return reminder;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.get("/reminders", async (req, reply) => {
    try {
      const reminders = await Reminder.find()
        .populate("habit_id")
        .populate("utilisateur_id");
      return reminders;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/reminders/:id", async (req, reply) => {
    try {
      const reminder = await Reminder.findById(req.params.id)
        .populate("habit_id")
        .populate("utilisateur_id");
      if (!reminder) {
        reply.code(404);
        return { error: "Reminder not found" };
      }
      return reminder;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.put("/reminders/:id", async (req, reply) => {
    try {
      const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!reminder) {
        reply.code(404);
        return { error: "Reminder not found" };
      }
      return reminder;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.delete("/reminders/:id", async (req, reply) => {
    try {
      const reminder = await Reminder.findByIdAndDelete(req.params.id);
      if (!reminder) {
        reply.code(404);
        return { error: "Reminder not found" };
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
