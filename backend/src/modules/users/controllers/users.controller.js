import { StatusCodes as httpStatus } from "http-status-codes";
import UsersService from "../services/users.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

const createUser       = _h(async (req, reply) => { reply.code(httpStatus.CREATED).send(await UsersService.createUser(req.body)); });
const getUsers         = _h(async (req, reply)  => { reply.send(await UsersService.getUsers(req.query.managerId || null)); });
const getUserById      = _h(async (req, reply)  => { reply.send(await UsersService.getUserById(req.params.id, req.user.id, req.user.permissions)); });
const updateUserRole   = _h(async (req, reply)  => { reply.send(await UsersService.updateUserRole(req.params.id, req.body.role)); });
const updateUser       = _h(async (req, reply)  => { reply.send(await UsersService.updateUser(req.params.id, req.body, req.user.id, req.user.permissions)); });
const updateUserStatus = _h(async (req, reply)  => { reply.send(await UsersService.updateUserStatus(req.params.id, req.body.isActive, req.user.id)); });
const adminCreateUser  = _h(async (req, reply)  => { reply.code(httpStatus.CREATED).send(await UsersService.adminCreateUser(req.body)); });

// Not wrapped in _h — needs to forward err.partial on USER-011 partial failures.
const deleteUser = async (req, reply) => {
  try {
    const result = await UsersService.anonymizeUser(
      req.params.id, req.user.id, req.user.role, req.user.permissions
    );
    reply.code(httpStatus.OK).send(result);
  } catch (err) {
    const body = { code: err.code, message: err.message };
    if (err.partial) body.partial = err.partial;
    reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send(body);
  }
};

const UsersController = { createUser, getUsers, getUserById, updateUserRole, updateUser, updateUserStatus, adminCreateUser, deleteUser };
export default UsersController;
