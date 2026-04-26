import HabitLogsController from "../controllers/habit-logs.controller.js";
import { createLogSchema, catchupLogSchema } from "../validations/habit-logs.validation.js";

const createLog     = (s) => ({ method: "POST",   url: "/logs",                          schema: createLogSchema,  preHandler: s.auth([s.verifyAccessToken]), handler: HabitLogsController.createLog });
const toggleLog     = (s) => ({ method: "POST",   url: "/logs/toggle",                   preHandler: s.auth([s.verifyAccessToken]), handler: HabitLogsController.toggleLogFromBody });
const getAllLogs     = (s) => ({ method: "GET",    url: "/logs",                          preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read", subject: "Log" }])]),     handler: HabitLogsController.getAllLogs });
const catchupLog    = (s) => ({ method: "POST",   url: "/logs/catchup",                  schema: catchupLogSchema, preHandler: s.auth([s.verifyAccessToken]), handler: HabitLogsController.catchupLog });
const incomplete    = (s) => ({ method: "GET",    url: "/logs/incomplete-for-date/:date", preHandler: s.auth([s.verifyAccessToken]), handler: HabitLogsController.getIncompleteForDate });
const getLogById    = (s) => ({ method: "GET",    url: "/logs/:id",                      preHandler: s.auth([s.verifyAccessToken]), handler: HabitLogsController.getLogById });
const updateLog     = (s) => ({ method: "PUT",    url: "/logs/:id",                      preHandler: s.auth([s.verifyAccessToken]), handler: HabitLogsController.updateLog });
const deleteLog     = (s) => ({ method: "DELETE", url: "/logs/:id",                      preHandler: s.auth([s.verifyAccessToken]), handler: HabitLogsController.deleteLog });

const routes = [createLog, toggleLog, getAllLogs, catchupLog, incomplete, getLogById, updateLog, deleteLog];

export default async function habitLogsRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
