import UsersController from "../controllers/users.controller.js";
import { createUserSchema, updateUserRoleSchema, updateUserStatusSchema } from "../validations/users.validation.js";

const createUser     = (s) => ({ method: "POST",   url: "/users",             schema: createUserSchema,       handler: UsersController.createUser });
const getUsers       = (s) => ({ method: "GET",    url: "/users",             preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read",   subject: "User" }])]), handler: UsersController.getUsers });
const getUserById    = (s) => ({ method: "GET",    url: "/users/:id",         preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.getUserById });
const updateUserRole = (s) => ({ method: "PATCH",  url: "/users/:id/role",   schema: updateUserRoleSchema,   preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "User" }])]), handler: UsersController.updateUserRole });
const updateUserStatus = (s) => ({ method: "PATCH", url: "/users/:id/status", schema: updateUserStatusSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "User" }])]), handler: UsersController.updateUserStatus });
const deleteUser     = (s) => ({ method: "DELETE", url: "/users/:id",         preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "User" }])]), handler: UsersController.deleteUser });
const updateUser     = (s) => ({ method: "PATCH",  url: "/users/:id",         preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.updateUser });
const updateUserPut  = (s) => ({ method: "PUT",    url: "/users/:id",         preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.updateUser });

// POST /users/admin removed — only managers may create users (via POST /managers/users)
const routes = [createUser, getUsers, getUserById, updateUserRole, updateUserStatus, deleteUser, updateUser, updateUserPut];

export default async function usersRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
