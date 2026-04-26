import { StatusCodes as httpStatus } from "http-status-codes";
import OffDaysService from "../services/off-days.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const getAll   = _h(async (_req, reply)  => { reply.send(await OffDaysService.getAll()); });
const getRange = _h(async (req,  reply)  => { reply.send(await OffDaysService.getRange(req.query.start, req.query.end)); });
const create   = _h(async (req,  reply)  => { reply.code(httpStatus.CREATED).send(await OffDaysService.create(req.body, req.user.id)); });
const update   = _h(async (req,  reply)  => { reply.send(await OffDaysService.update(req.params.id, req.body)); });
const remove   = _h(async (req,  reply)  => { await OffDaysService.delete(req.params.id); reply.code(httpStatus.NO_CONTENT).send(null); });

const OffDaysController = { getAll, getRange, create, update, remove };
export default OffDaysController;
