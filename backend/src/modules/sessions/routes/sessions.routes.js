import * as controller from "../controllers/sessions.controller.js";

export default async function routes(fastify) {
  fastify.post("/sessions",       { preHandler: fastify.auth([fastify.verifyAccessToken]) },                                                                               controller.createSession);
  fastify.get("/sessions",        { preHandler: fastify.auth([fastify.verifyAccessToken, fastify.verifyAbility([{ action: "read", subject: "Session" }])]) },              controller.getSessions);
  fastify.delete("/sessions/:id", { preHandler: fastify.auth([fastify.verifyAccessToken]) },                                                                               controller.deleteSession);
}
