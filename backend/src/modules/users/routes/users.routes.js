import UsersController from "../controllers/users.controller.js";
import { createUserSchema, updateUserRoleSchema, updateUserStatusSchema } from "../validations/users.validation.js";

const createUser     = (s) => ({ method: "POST",   url: "/users",             schema: createUserSchema,       preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "User" }])]), handler: UsersController.createUser });
const getUsers       = (s) => ({ method: "GET",    url: "/users",             preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read",   subject: "User" }])]), handler: UsersController.getUsers });
const searchUsers    = (s) => ({ method: "GET",    url: "/users/search",      preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.searchUsers });
const getUserById    = (s) => ({ method: "GET",    url: "/users/:id",         preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.getUserById });
const updateUserRole = (s) => ({ method: "PATCH",  url: "/users/:id/role",   schema: updateUserRoleSchema,   preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "User" }])]), handler: UsersController.updateUserRole });
const updateUserStatus = (s) => ({ method: "PATCH", url: "/users/:id/status", schema: updateUserStatusSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "User" }])]), handler: UsersController.updateUserStatus });
const deleteUser     = (s) => ({ method: "DELETE", url: "/users/:id",         preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "User" }])]), handler: UsersController.deleteUser });
const updateUser     = (s) => ({ method: "PATCH",  url: "/users/:id",         preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.updateUser });
const updateUserPut  = (s) => ({ method: "PUT",    url: "/users/:id",         preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.updateUser });

const adminCreateUser  = (s) => ({ method: "POST",   url: "/users/admin",                 preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "User" }])]), handler: UsersController.adminCreateUser });
const getMyCategories  = (s) => ({ method: "GET",    url: "/users/me/categories",          preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.getMyCategories });
const addMyCategories  = (s) => ({ method: "POST",   url: "/users/me/categories",          preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.addMyCategories });
const removeMyCategory = (s) => ({ method: "DELETE", url: "/users/me/categories/:slug",    preHandler: s.auth([s.verifyAccessToken]), handler: UsersController.removeMyCategory });

const routes = [adminCreateUser, getMyCategories, addMyCategories, removeMyCategory, createUser, getUsers, searchUsers, getUserById, updateUserRole, updateUserStatus, deleteUser, updateUser, updateUserPut];

export default async function usersRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}


