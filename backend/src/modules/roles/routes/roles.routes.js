import RolesController from "../controllers/roles.controller.js";
import { createRoleSchema, updateRoleSchema, updatePermissionsSchema } from "../validations/roles.validation.js";

const getRoles          = (s) => ({ method: "GET",    url: "/roles",                    preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read",   subject: "Role" }])]), handler: RolesController.getRoles });
const createRole        = (s) => ({ method: "POST",   url: "/roles",      schema: createRoleSchema,        preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Role" }])]), handler: RolesController.createRole });
const updateRole        = (s) => ({ method: "PUT",    url: "/roles/:id",  schema: updateRoleSchema,        preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Role" }])]), handler: RolesController.updateRole });
const updatePermissions = (s) => ({ method: "PATCH",  url: "/roles/:id/permissions", schema: updatePermissionsSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Role" }])]), handler: RolesController.updatePermissions });
const deleteRole        = (s) => ({ method: "DELETE", url: "/roles/:id",                preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Role" }])]), handler: RolesController.deleteRole });

// Static routes before parameterised
const routes = [getRoles, createRole, updatePermissions, updateRole, deleteRole];

export default async function rolesRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
