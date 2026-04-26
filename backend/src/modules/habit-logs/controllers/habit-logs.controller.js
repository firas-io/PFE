import { StatusCodes as httpStatus } from "http-status-codes";
import HabitLogsService from "../services/habit-logs.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const createLog           = _h(async (req, reply) => { reply.code(httpStatus.CREATED).send(await HabitLogsService.createLog(req.body, req.user.id, req.user.permissions)); });
const toggleLogFromBody   = _h(async (req, reply) => { reply.send(await HabitLogsService.toggleLogForDate(req.body?.habit_id, req.body?.date, req.user.id, req.user.permissions)); });
const getAllLogs           = _h(async (_req, reply) => { reply.send(await HabitLogsService.getAllLogs()); });
const getLogById          = _h(async (req, reply)  => { reply.send(await HabitLogsService.getLogById(req.params.id, req.user.id, req.user.permissions)); });
const updateLog           = _h(async (req, reply)  => { reply.send(await HabitLogsService.updateLog(req.params.id, req.body, req.user.id, req.user.permissions)); });
const getIncompleteForDate = _h(async (req, reply) => { reply.send(await HabitLogsService.getIncompleteForDate(req.params.date, req.user.id)); });
const catchupLog          = _h(async (req, reply)  => { reply.code(httpStatus.CREATED).send(await HabitLogsService.catchupLog(req.body, req.user.id, req.user.permissions)); });

const deleteLog = _h(async (req, reply) => {
  await HabitLogsService.deleteLog(req.params.id, req.user.id, req.user.permissions);
  reply.code(httpStatus.NO_CONTENT).send(null);
});

const HabitLogsController = { createLog, toggleLogFromBody, getAllLogs, getLogById, updateLog, getIncompleteForDate, catchupLog, deleteLog };
export default HabitLogsController;
