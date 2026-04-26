import HabitStatsController from "../controllers/habit-stats.controller.js";

const createStats     = (s) => ({ method: "POST", url: "/stats",              preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "HabitStats" }])]), handler: HabitStatsController.createStats });
const getAllStats      = (s) => ({ method: "GET",  url: "/stats",              preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read",   subject: "HabitStats" }])]), handler: HabitStatsController.getAllStats });
const getStatsByHabit = (s) => ({ method: "GET",  url: "/stats/habit/:habitId", preHandler: s.auth([s.verifyAccessToken]), handler: HabitStatsController.getStatsByHabit });
const getStatsById    = (s) => ({ method: "GET",  url: "/stats/:id",           preHandler: s.auth([s.verifyAccessToken]), handler: HabitStatsController.getStatsById });

const routes = [createStats, getAllStats, getStatsByHabit, getStatsById];
export default async function habitStatsRoutes(fastify) { routes.forEach(r => fastify.route(r(fastify))); }
