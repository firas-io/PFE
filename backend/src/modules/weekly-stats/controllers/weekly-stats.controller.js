import { StatusCodes as httpStatus } from "http-status-codes";
import WeeklyStatsService from "../services/weekly-stats.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const getAdminStats   = _h(async (req,  reply) => {
  const { period, dateFrom, dateTo } = req.query ?? {};
  reply.send(await WeeklyStatsService.getAdminStats({ period, dateFrom, dateTo }));
});
const getManagerStats = _h(async (req,  reply) => {
  const { period, dateFrom, dateTo } = req.query ?? {};
  reply.send(await WeeklyStatsService.getManagerStats(req.user.id, { period, dateFrom, dateTo }));
});
const getUserStats    = _h(async (req,  reply) => {
  const { period, dateFrom, dateTo } = req.query ?? {};
  reply.send(await WeeklyStatsService.getUserStats(req.user.id, { period, dateFrom, dateTo }));
});

const WeeklyStatsController = { getAdminStats, getManagerStats, getUserStats };
export default WeeklyStatsController;
