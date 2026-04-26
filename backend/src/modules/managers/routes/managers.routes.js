import ManagersController from "../controllers/managers.controller.js";
import {
  createManagerSchema,
  updateManagerSchema,
  createManagerUserSchema,
  updateManagerUserSchema,
} from "../validations/managers.validation.js";

// ─── Admin-only: managers CRUD ───────────────────────────────────────────────
const getManagers   = (s) => ({ method: "GET",    url: "/managers",     preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Manager" }])]), handler: ManagersController.getManagers });
const createManager = (s) => ({ method: "POST",   url: "/managers",     schema: createManagerSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Manager" }])]), handler: ManagersController.createManager });
const updateManager = (s) => ({ method: "PATCH",  url: "/managers/:id", schema: updateManagerSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Manager" }])]), handler: ManagersController.updateManager });
const deleteManager = (s) => ({ method: "DELETE", url: "/managers/:id", preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Manager" }])]), handler: ManagersController.deleteManager });

// ─── Admin: read-only roster of users assigned to a given manager ─────────────
const getManagerTeamForAdmin = (s) => ({
  method: "GET",
  url: "/managers/:managerId/team",
  preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Manager" }])]),
  handler: ManagersController.getManagerTeamForAdmin,
});

// ─── Manager: own users CRUD ─────────────────────────────────────────────────
// NOTE: /managers/users must be registered BEFORE /managers/:id to avoid parameter capture
const getManagerUsers   = (s) => ({ method: "GET",    url: "/managers/users",     preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read",   subject: "ManagerUser" }])]), handler: ManagersController.getManagerUsers });
const getManagerUsersNotes = (s) => ({ method: "GET",    url: "/managers/users/notes", preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "read", subject: "ManagerUser" }])]), handler: ManagersController.getManagerUsersNotes });
const createManagerUser = (s) => ({ method: "POST",   url: "/managers/users",     schema: createManagerUserSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "ManagerUser" }])]), handler: ManagersController.createManagerUser });
const updateManagerUser = (s) => ({ method: "PATCH",  url: "/managers/users/:id", schema: updateManagerUserSchema, preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "ManagerUser" }])]), handler: ManagersController.updateManagerUser });
const deleteManagerUser = (s) => ({ method: "DELETE", url: "/managers/users/:id", preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "ManagerUser" }])]), handler: ManagersController.deleteManagerUser });

// Static routes (/managers/users) MUST come before parameterised (/managers/:id)
const routes = [getManagerUsers, getManagerUsersNotes, createManagerUser, updateManagerUser, deleteManagerUser, getManagerTeamForAdmin, getManagers, createManager, updateManager, deleteManager];

export default async function managersRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
