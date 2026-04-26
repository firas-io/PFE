import * as controller from "../controllers/progress.controller.js";

export default async function routes(fastify) {
  fastify.get("/progress/my",       { preHandler: fastify.auth([fastify.verifyAccessToken]) }, controller.getMyProgress);
  fastify.get("/progress/today",    { preHandler: fastify.auth([fastify.verifyAccessToken]) }, controller.getToday);
  fastify.get("/progress/calendar", { preHandler: fastify.auth([fastify.verifyAccessToken]) }, controller.getCalendar);
}
