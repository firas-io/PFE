import { StatusCodes as httpStatus } from "http-status-codes";
import ManagersService from "../services/managers.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

// ─── Admin: managers CRUD ───────────────────────────────────────────────────
const getManagers    = _h(async (_req, reply) => { reply.send(await ManagersService.getManagers()); });
const createManager  = _h(async (req, reply)  => { reply.code(httpStatus.CREATED).send(await ManagersService.createManager(req.body)); });
const updateManager  = _h(async (req, reply)  => { reply.send(await ManagersService.updateManager(req.params.id, req.body)); });
const deleteManager  = _h(async (req, reply)  => {
  await ManagersService.deleteManager(req.params.id, req.user.id);
  reply.code(httpStatus.NO_CONTENT).send(null);
});

const getManagerTeamForAdmin = _h(async (req, reply) => {
  reply.send(await ManagersService.getManagerTeamForAdmin(req.params.managerId));
});

// ─── Manager: own users CRUD ────────────────────────────────────────────────
const getManagerUsers    = _h(async (req, reply) => { reply.send(await ManagersService.getManagerUsers(req.user.id)); });
const getManagerUsersNotes = _h(async (req, reply) => { reply.send(await ManagersService.getManagerUsersNotes(req.user.id, req.query)); });
const createManagerUser  = _h(async (req, reply) => { reply.code(httpStatus.CREATED).send(await ManagersService.createManagerUser(req.body, req.user.id)); });
const updateManagerUser  = _h(async (req, reply) => { reply.send(await ManagersService.updateManagerUser(req.params.id, req.body, req.user.id)); });
const deleteManagerUser  = _h(async (req, reply) => {
  await ManagersService.deleteManagerUser(req.params.id, req.user.id);
  reply.code(httpStatus.NO_CONTENT).send(null);
});

const ManagersController = {
  getManagers, createManager, updateManager, deleteManager, getManagerTeamForAdmin,
  getManagerUsers, getManagerUsersNotes, createManagerUser, updateManagerUser, deleteManagerUser,
};
export default ManagersController;
