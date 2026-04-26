import HabitTemplatesController from "../controllers/habit-templates.controller.js";

const getTemplates       = (s) => ({ method: "GET",  url: "/habits/templates",                  preHandler: s.auth([s.verifyAccessToken]), handler: HabitTemplatesController.getTemplates });
const createFromTemplate = (s) => ({ method: "POST", url: "/habits/from-template/:templateId",  preHandler: s.auth([s.verifyAccessToken]), handler: HabitTemplatesController.createFromTemplate });

const routes = [getTemplates, createFromTemplate];

export default async function habitTemplatesRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
