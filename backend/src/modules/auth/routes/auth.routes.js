import AuthController from "../controllers/auth.controller.js";
import { registerSchema, loginSchema, loginLdapSchema, refreshSchema, logoutSchema } from "../validations/auth.validation.js";

const register = (server) => ({
  method: "POST", url: "/register",
  schema:  registerSchema,
  config:  { rateLimit: { max: 3, timeWindow: "1 hour" } },
  handler: AuthController.register,
});

const login = (server) => ({
  method: "POST", url: "/login",
  schema:  loginSchema,
  config:  { rateLimit: { max: 5, timeWindow: "1 minute" } },
  handler: AuthController.login,
});

const authConfig = (server) => ({
  method: "GET",
  url: "/auth/config",
  handler: AuthController.authConfig,
});

const loginLdap = (server) => ({
  method: "POST", url: "/login/ldap",
  schema:  loginLdapSchema,
  config:  { rateLimit: { max: 5, timeWindow: "1 minute" } },
  handler: AuthController.loginLdap,
});

const getProfile = (server) => ({
  method: "GET", url: "/profile",
  preHandler: server.auth([server.verifyAccessToken]),
  handler: AuthController.getProfile,
});

const refresh = (server) => ({
  method: "POST", url: "/refresh",
  schema:  refreshSchema,
  config:  { rateLimit: { max: 10, timeWindow: "1 minute" } },
  handler: AuthController.refresh,
});

const logout = (server) => ({
  method: "POST", url: "/logout",
  schema:  logoutSchema,
  handler: AuthController.logout,
});

const logoutAll = (server) => ({
  method: "POST", url: "/logout-all",
  preHandler: server.auth([server.verifyAccessToken]),
  handler: AuthController.logoutAll,
});

const routes = [authConfig, register, login, loginLdap, getProfile, refresh, logout, logoutAll];

export default async function authRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
