import { StatusCodes as httpStatus } from "http-status-codes";
import CategoryTicketsService from "../services/category-tickets.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const getMyTickets   = _h(async (req, reply) => { reply.send(await CategoryTicketsService.getMyTickets(req.user.id)); });
const create         = _h(async (req, reply) => { reply.code(httpStatus.CREATED).send(await CategoryTicketsService.create(req.body, req.user.id)); });
const deleteOwn      = _h(async (req, reply) => { await CategoryTicketsService.deleteOwn(req.params.id, req.user.id); reply.code(httpStatus.NO_CONTENT).send(null); });
const getAll         = _h(async (req, reply) => { reply.send(await CategoryTicketsService.getAll(req.query)); });
const updateStatus   = _h(async (req, reply) => { reply.send(await CategoryTicketsService.updateStatus(req.params.id, req.body, req.user.id)); });

const CategoryTicketsController = { getMyTickets, create, deleteOwn, getAll, updateStatus };
export default CategoryTicketsController;
