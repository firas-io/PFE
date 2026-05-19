import { StatusCodes as httpStatus } from "http-status-codes";
import AdminStatsService from "../services/admin-stats.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const getLast12Weeks = _h(async (req, reply) => {
  const { period, dateFrom, dateTo } = req.query;
  reply.send(await AdminStatsService.getLast12Weeks({ period, dateFrom, dateTo }));
});

const AdminStatsController = { getLast12Weeks };
export default AdminStatsController;
