import HabitsController from "../controllers/habits.controller.js";
import { createHabitSchema, updateHabitStatusSchema } from "../validations/habits.validation.js";

const createHabit        = (s) => ({ method: "POST",  url: "/habits",                       schema: createHabitSchema,        preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.createHabit });
const getAllHabits        = (s) => ({ method: "GET",   url: "/habits",                       preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read", subject: "Habit" }])]), handler: HabitsController.getAllHabits });
// Static routes BEFORE parameterised /:id
const getMyHabits        = (s) => ({ method: "GET",   url: "/habits/my",                    preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.getMyHabits });
const getGlobalHabits    = (s) => ({ method: "GET",   url: "/habits/global",                preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.getGlobalHabits });
const searchHabits       = (s) => ({ method: "GET",   url: "/habits/search",                preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.searchHabits });

const getHabitById       = (s) => ({ method: "GET",    url: "/habits/:id",                  preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.getHabitById });
const updateHabit        = (s) => ({ method: "PUT",    url: "/habits/:id",                  preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.updateHabit });
const updateStatus       = (s) => ({ method: "PATCH",  url: "/habits/:id/status",           schema: updateHabitStatusSchema, preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.updateHabitStatus });
const updateNotes        = (s) => ({ method: "PATCH",  url: "/habits/:id/notes",            preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.updateHabitNotes });
const getNoteHistory     = (s) => ({ method: "GET",    url: "/habits/:id/notes/history",    preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.getNoteHistory });
const getStreaks          = (s) => ({ method: "GET",    url: "/habits/:id/streaks",          preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.getStreaks });
const cloneHabit         = (s) => ({ method: "POST",   url: "/habits/:id/clone",            preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.cloneHabit });
const activateHabit      = (s) => ({ method: "POST",   url: "/habits/:id/activate",         preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.activateHabit });
const updateMySettings   = (s) => ({ method: "PATCH",  url: "/habits/:id/my-settings",     preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.updateMyHabitSettings });
const archiveHabit       = (s) => ({ method: "DELETE", url: "/habits/:id",                  preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Habit" }])]), handler: HabitsController.archiveHabit });
const restoreHabit       = (s) => ({ method: "POST",   url: "/habits/:id/restore",          preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.restoreHabit });
const deleteHabit        = (s) => ({ method: "DELETE", url: "/habits/:id/hard",             preHandler: s.auth([s.verifyAccessToken]), handler: HabitsController.deleteHabit });

const routes = [
  createHabit, getAllHabits, getMyHabits, getGlobalHabits, searchHabits,
  getHabitById, updateHabit, updateStatus, updateNotes, getNoteHistory,
  getStreaks, cloneHabit, activateHabit, updateMySettings, archiveHabit, restoreHabit, deleteHabit,
];

export default async function habitsRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
