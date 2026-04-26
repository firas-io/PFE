import * as controller from "../controllers/reminders.controller.js";

export default async function routes(fastify) {
  fastify.post("/reminders",       { preHandler: fastify.auth([fastify.verifyAccessToken]) },                                                                                  controller.createReminder);
  fastify.get("/reminders",        { preHandler: fastify.auth([fastify.verifyAccessToken, fastify.verifyAbility([{ action: "read", subject: "Reminder" }])]) },                controller.getReminders);
  fastify.get("/reminders/:id",    { preHandler: fastify.auth([fastify.verifyAccessToken]) },                                                                                  controller.getReminderById);
  fastify.delete("/reminders/:id", { preHandler: fastify.auth([fastify.verifyAccessToken]) },                                                                                  controller.deleteReminder);
}
