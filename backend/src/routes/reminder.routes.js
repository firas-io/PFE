/**
 * reminder.routes.js
 * Reminder endpoints.
 */
const controller = require("../controllers/reminder.controller");

async function routes(fastify) {
  fastify.post("/reminders", { preHandler: [fastify.authenticate] }, controller.createReminder);
  fastify.get("/reminders", { preHandler: [fastify.authenticate, fastify.authorize(["REMINDERS_VIEW"])] }, controller.getReminders);
  fastify.get("/reminders/:id", { preHandler: [fastify.authenticate] }, controller.getReminderById);
  fastify.delete("/reminders/:id", { preHandler: [fastify.authenticate] }, controller.deleteReminder);
}

module.exports = routes;
