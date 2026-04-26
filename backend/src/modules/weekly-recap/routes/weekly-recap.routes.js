import WeeklyRecapController from "../controllers/weekly-recap.controller.js";

// Static (/latest) and (/list root) BEFORE parameterised (/:id/viewed)
const getLatest  = (s) => ({ method: "GET",   url: "/weekly-recap/latest",      preHandler: s.auth([s.verifyAccessToken]), handler: WeeklyRecapController.getLatest });
const list       = (s) => ({ method: "GET",   url: "/weekly-recap",             preHandler: s.auth([s.verifyAccessToken]), handler: WeeklyRecapController.list });
const markViewed = (s) => ({ method: "PATCH", url: "/weekly-recap/:id/viewed",  preHandler: s.auth([s.verifyAccessToken]), handler: WeeklyRecapController.markViewed });

const routes = [getLatest, list, markViewed];

export default async function weeklyRecapRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
