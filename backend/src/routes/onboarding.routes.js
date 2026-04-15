/**
 * onboarding.routes.js
 * Onboarding endpoints.
 */
const controller = require("../controllers/onboarding.controller");

async function routes(fastify) {
  fastify.post("/onboarding", { preHandler: [fastify.authenticate] }, controller.createOnboarding);
  fastify.get("/onboarding", { preHandler: [fastify.authenticate, fastify.authorize(["ONBOARDING_VIEW"])] }, controller.getOnboardings);
  fastify.get("/onboarding/:id", { preHandler: [fastify.authenticate] }, controller.getOnboardingById);
  fastify.put("/onboarding/:id", { preHandler: [fastify.authenticate] }, controller.updateOnboarding);
}

module.exports = routes;
