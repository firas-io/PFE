import { StatusCodes as httpStatus } from "http-status-codes";
import HabitStatsService from "../services/habit-stats.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const createStats      = _h(async (req, reply) => { reply.code(httpStatus.CREATED).send(await HabitStatsService.createStats(req.body)); });
const getAllStats       = _h(async (_req, reply) => { reply.send(await HabitStatsService.getAllStats()); });
const getStatsById     = _h(async (req, reply)  => { reply.send(await HabitStatsService.getStatsById(req.params.id, req.user.id, req.user.permissions)); });
const getStatsByHabit  = _h(async (req, reply)  => { reply.send(await HabitStatsService.getStatsByHabit(req.params.habitId, req.user.id, req.user.permissions)); });

const HabitStatsController = { createStats, getAllStats, getStatsById, getStatsByHabit };
export default HabitStatsController;
