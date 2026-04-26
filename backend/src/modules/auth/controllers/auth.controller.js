import { StatusCodes as httpStatus } from "http-status-codes";
import AuthService from "../services/auth.service.js";
import { getFirstName, getLastName } from "@/modules/users/utils/user-fields.js";

const _ldapEnabled = () => String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true";

async function sendLoginSuccess(reply, { user, role, onboardingPending, isFirstLogin }) {
  const uid          = String(user._id);
  const accessToken  = await reply.jwtSign({ id: uid, email: user.email, role: role.nom, permissions: role.permissions || [] });
  const refreshToken = await AuthService.createRefreshToken(uid);
  reply.send({
    token:        accessToken,
    accessToken,
    refreshToken,
    onboardingPending,
    isFirstLogin: isFirstLogin ?? onboardingPending,
    user: {
      _id: uid,
      firstName: getFirstName(user),
      lastName: getLastName(user),
      email: user.email,
      role: role.nom,
      permissions: role.permissions || [],
      isFirstLogin: isFirstLogin ?? onboardingPending,
      categories: user.categories ?? [],
    },
  });
}

const register = async (req, reply) => {
  try {
    const result = await AuthService.register(req.body);
    reply.code(httpStatus.CREATED).send(result);
  } catch (err) {
    reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({ code: err.code, message: err.message });
  }
};

const login = async (req, reply) => {
  try {
    const bundle = _ldapEnabled()
      ? await AuthService.validateLdapLogin(req.body)
      : await AuthService.validateLogin(req.body);
    await sendLoginSuccess(reply, bundle);
  } catch (err) {
    reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({ code: err.code, message: err.message });
  }
};

const loginLdap = async (req, reply) => {
  try {
    if (!_ldapEnabled())
      return reply.code(httpStatus.NOT_IMPLEMENTED).send({ code: "AUTH-007", message: "LDAP authentication disabled" });

    const bundle = await AuthService.validateLdapLogin(req.body);
    await sendLoginSuccess(reply, bundle);
  } catch (err) {
    reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({ code: err.code, message: err.message });
  }
};

const authConfig = async (_req, reply) => {
  reply.send({ ldapEnabled: _ldapEnabled() });
};

const getProfile = async (req) => req.user;

const refresh = async (req, reply) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken, reply.jwtSign.bind(reply));
    reply.send(result);
  } catch (err) {
    reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({ code: err.code, message: err.message });
  }
};

const logout = async (req, reply) => {
  try {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);
    reply.code(httpStatus.NO_CONTENT).send();
  } catch (err) {
    reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({ code: err.code, message: err.message });
  }
};

const logoutAll = async (req, reply) => {
  try {
    await AuthService.logoutAll(req.user.id);
    reply.code(httpStatus.NO_CONTENT).send();
  } catch (err) {
    reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({ code: err.code, message: err.message });
  }
};

const AuthController = { register, login, loginLdap, authConfig, getProfile, refresh, logout, logoutAll };
export default AuthController;
