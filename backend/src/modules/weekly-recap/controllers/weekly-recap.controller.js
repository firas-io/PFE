import { StatusCodes as httpStatus } from "http-status-codes";
import WeeklyRecapService from "../services/weekly-recap.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const getLatest  = _h(async (req, reply) => { reply.send(await WeeklyRecapService.getLatest(req.user.id)); });
const list       = _h(async (req, reply) => { reply.send(await WeeklyRecapService.list(req.user.id, req.query)); });
const markViewed = _h(async (req, reply) => { reply.send(await WeeklyRecapService.markViewed(req.params.id, req.user.id)); });

const WeeklyRecapController = { getLatest, list, markViewed };
export default WeeklyRecapController;
