import RolesController from "../controllers/roles.controller.js";
import { createRoleSchema, updateRoleSchema } from "../validations/roles.validation.js";

const getRoles    = (s) => ({ method: "GET",    url: "/roles",      preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read",   subject: "Role" }])]), handler: RolesController.getRoles });
const createRole  = (s) => ({ method: "POST",   url: "/roles",      schema: createRoleSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Role" }])]), handler: RolesController.createRole });
const updateRole  = (s) => ({ method: "PUT",    url: "/roles/:id",  schema: updateRoleSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Role" }])]), handler: RolesController.updateRole });
const deleteRole  = (s) => ({ method: "DELETE", url: "/roles/:id",  preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Role" }])]), handler: RolesController.deleteRole });

const routes = [getRoles, createRole, updateRole, deleteRole];

export default async function rolesRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
