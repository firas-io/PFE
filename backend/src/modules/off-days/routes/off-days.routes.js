import OffDaysController from "../controllers/off-days.controller.js";

// Static routes BEFORE parameterised
const getRange = (s) => ({ method: "GET",    url: "/off-days/range",  preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read", subject: "OffDay" }])]),          handler: OffDaysController.getRange });
const getAll   = (s) => ({ method: "GET",    url: "/off-days",        preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read", subject: "OffDay" }])]),          handler: OffDaysController.getAll });
const create   = (s) => ({ method: "POST",   url: "/off-days",        preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "OffDay" }])]),         handler: OffDaysController.create });
const update   = (s) => ({ method: "PATCH",  url: "/off-days/:id",    preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "OffDay" }])]),         handler: OffDaysController.update });
const remove   = (s) => ({ method: "DELETE", url: "/off-days/:id",    preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "OffDay" }])]),         handler: OffDaysController.remove });

const routes = [getRange, getAll, create, update, remove];

export default async function offDaysRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
