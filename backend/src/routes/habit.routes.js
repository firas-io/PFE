/**
 * habit.routes.js
 * Habit CRUD, status, notes, clone, and admin note view endpoints.
 */
const controller = require("../controllers/habit.controller");

async function routes(fastify) {
  // Public-facing habit operations
  fastify.post("/habits", { preHandler: [fastify.authenticate] }, controller.createHabit);
  fastify.get("/habits", { preHandler: [fastify.authenticate, fastify.authorize(["HABITS_VIEW"])] }, controller.getAllHabits);
  fastify.get("/habits/my", { preHandler: [fastify.authenticate] }, controller.getMyHabits);

  // Admin note views (must be defined BEFORE /habits/:id to avoid route conflict)
  fastify.get("/habits/admin/notes/all", { preHandler: [fastify.authenticate, fastify.authorize(["HABITS_MANAGE", "ALL"])] }, controller.adminGetAllNotes);
  fastify.get("/habits/admin/notes/by-habit/:habitId", { preHandler: [fastify.authenticate, fastify.authorize(["HABITS_MANAGE", "ALL"])] }, controller.adminGetNotesByHabit);
  fastify.get("/habits/admin/notes/by-user/:userId", { preHandler: [fastify.authenticate, fastify.authorize(["HABITS_MANAGE", "ALL"])] }, controller.adminGetNotesByUser);

  // Single habit operations
  fastify.get("/habits/:id", { preHandler: [fastify.authenticate] }, controller.getHabitById);
  fastify.put("/habits/:id", { preHandler: [fastify.authenticate] }, controller.updateHabit);
  fastify.patch("/habits/:id/status", { preHandler: [fastify.authenticate] }, controller.updateHabitStatus);
  fastify.patch("/habits/:id/notes", { preHandler: [fastify.authenticate] }, controller.updateHabitNotes);
  fastify.get("/habits/:id/notes/history", { preHandler: [fastify.authenticate] }, controller.getNoteHistory);
  fastify.post("/habits/:id/clone", { preHandler: [fastify.authenticate] }, controller.cloneHabit);
  fastify.delete("/habits/:id", { preHandler: [fastify.authenticate] }, controller.archiveHabit);
  fastify.delete("/habits/:id/hard", { preHandler: [fastify.authenticate] }, controller.deleteHabit);
}

module.exports = routes;
