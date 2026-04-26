import { StatusCodes as httpStatus } from "http-status-codes";
import RolesService from "../services/roles.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const getRoles    = _h(async (_req, reply) => { reply.send(await RolesService.getRoles()); });
const createRole  = _h(async (req, reply)  => { reply.code(httpStatus.CREATED).send(await RolesService.createRole(req.body)); });
const updateRole  = _h(async (req, reply)  => { reply.send(await RolesService.updateRole(req.params.id, req.body)); });
const deleteRole  = _h(async (req, reply)  => {
  await RolesService.deleteRole(req.params.id);
  reply.code(httpStatus.NO_CONTENT).send(null);
});

const RolesController = { getRoles, createRole, updateRole, deleteRole };
export default RolesController;
