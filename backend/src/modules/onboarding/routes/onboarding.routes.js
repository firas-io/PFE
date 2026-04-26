import * as controller from "../controllers/onboarding.controller.js";

export default async function routes(fastify) {
  fastify.post("/onboarding/categories",  { preHandler: fastify.auth([fastify.verifyAccessToken]) }, controller.saveCategories);
  fastify.post("/onboarding",             { preHandler: fastify.auth([fastify.verifyAccessToken]) }, controller.createOnboarding);
  fastify.get("/onboarding",              { preHandler: fastify.auth([fastify.verifyAccessToken, fastify.verifyAbility([{ action: "read", subject: "Onboarding" }])]) }, controller.getOnboardings);
  fastify.get("/onboarding/:id",          { preHandler: fastify.auth([fastify.verifyAccessToken]) }, controller.getOnboardingById);
  fastify.put("/onboarding/:id",          { preHandler: fastify.auth([fastify.verifyAccessToken]) }, controller.updateOnboarding);
}
