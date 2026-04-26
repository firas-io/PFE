import bcrypt          from "bcrypt";
import crypto          from "crypto";
import { Users }       from "@/modules/users/models/User.model.js";
import { Roles }       from "@/modules/roles/models/Role.model.js";
import { Onboardings } from "@/modules/onboarding/models/Onboarding.model.js";
import { RefreshTokens } from "../models/RefreshToken.model.js";
import { AppError }    from "@/core/errors.js";
import logger          from "@/utils/logger.util.js";
import { authenticateUser, lookupUserByDn } from "./ldap.service.js";
import { ErrorsCodes, ErrorMessages } from "../constants/auth.constants.js";
import { getFirstName, getLastName, getPasswordHash } from "@/modules/users/utils/user-fields.js";

const REFRESH_TTL_DAYS = 7;

/** Escape email for safe case-insensitive exact match in MongoDB $regex. */
function _emailRegexExact(email) {
  const s = String(email).trim();
  return new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

/**
 * Detect the role name from the LDAP DN.
 *   - DN contains LDAP_MANAGERS_OU  → "manager"
 *   - email matches LDAP_ADMIN_EMAIL → "admin"
 *   - anything else                  → "utilisateur"
 */
function _detectRoleFromDn(dn, email) {
  const managersOu = (process.env.LDAP_MANAGERS_OU || "ou=managers").toLowerCase();
  const adminEmail = (process.env.LDAP_ADMIN_EMAIL  || "admin@habitflow.local").toLowerCase();

  if (String(email).toLowerCase() === adminEmail) return "admin";
  if (String(dn).toLowerCase().includes(managersOu)) return "manager";
  return "utilisateur";
}

class AuthService {
  /** Case-insensitive email match (Mongo stores exact casing from forms). */
  static async _findUserByLoginEmail(email) {
    const trimmed = String(email ?? "").trim();
    if (!trimmed) return null;
    const exact = await Users.findOne({ email: trimmed });
    if (exact) return exact;
    return Users.findOne({ email: { $regex: _emailRegexExact(trimmed) } });
  }

  /** Runs after every successful login. Returns onboardingPending + isFirstLogin flags. */
  static async _handleFirstLogin(userId) {
    const existing = await Onboardings.findOne({ user_id: userId });

    const onboardingPending = !existing || !existing.completed;

    if (!existing) {
      await Onboardings.insertOne({ user_id: userId, status: "pending", completed: false });
      logger.info({ action: "first-login-onboarding", userId }, "Onboarding created on first login");
    }

    await Users.updateOne(
      { _id: userId, first_login_at: { $exists: false } },
      { $set: { first_login_at: new Date() } }
    );

    const user = await Users.findById(userId);
    const isFirstLogin = user?.isFirstLogin !== false ? onboardingPending : false;

    return { onboardingPending, isFirstLogin };
  }

  /**
   * Resolve the manager_id for a LDAP user.
   *
   * Steps:
   *   1. Look up the manager DN in LDAP to get their email.
   *   2. Find the manager in MongoDB by email.
   *   3. If the manager doesn't exist in MongoDB yet, create them with role "manager".
   *   4. Return the manager's _id.
   */
  static async _resolveManagerId(managerDn) {
    if (!managerDn) return null;

    try {
      const ldapManager = await lookupUserByDn(managerDn);
      if (!ldapManager?.email) {
        logger.warn({ action: "ldap-resolve-manager", managerDn }, "Manager DN found in LDAP but has no email");
        return null;
      }

      let managerUser = await AuthService._findUserByLoginEmail(ldapManager.email);

      if (!managerUser) {
        // Manager exists in LDAP but not yet in MongoDB — create them
        const managerRole = await Roles.findOne({ nom: "manager" });
        if (!managerRole) {
          logger.warn({ action: "ldap-resolve-manager" }, "Role 'manager' not found in DB — skipping manager_id assignment");
          return null;
        }

        const firstName = ldapManager.givenName || (ldapManager.cn ? String(ldapManager.cn).split(" ")[0] : "Manager");
        const lastName  = ldapManager.sn        || (ldapManager.cn ? String(ldapManager.cn).split(" ").slice(1).join(" ") : "LDAP");
        const hashed    = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

        managerUser = await Users.insertOne({
          firstName,
          lastName,
          email:        ldapManager.email,
          passwordHash: hashed,
          role_id:      managerRole._id,
          isActive:     true,
          isFirstLogin: true,
          categories:   [],
        });

        logger.info({ action: "ldap-auto-create-manager", email: ldapManager.email }, "Manager auto-created from LDAP DN");
      }

      return String(managerUser._id);
    } catch (e) {
      logger.warn({ action: "ldap-resolve-manager", managerDn, err: e.message }, "Failed to resolve manager DN");
      return null;
    }
  }

  static async register({ mot_de_passe, nom, prenom, email }) {
    if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true")
      throw new AppError(ErrorMessages[ErrorsCodes.REGISTER_DISABLED_LDAP], 403, ErrorsCodes.REGISTER_DISABLED_LDAP);

    if (!email || !mot_de_passe || !nom || !prenom)
      throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    if (await Users.findOne({ email }))
      throw new AppError(ErrorMessages[ErrorsCodes.EMAIL_IN_USE], 400, ErrorsCodes.EMAIL_IN_USE);

    const userRole = await Roles.findOne({ nom: "utilisateur" });
    if (!userRole)
      throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_INIT], 500, ErrorsCodes.ROLE_NOT_INIT);

    const hashed = await bcrypt.hash(mot_de_passe, 10);
    await Users.insertOne({
      firstName: prenom,
      lastName: nom,
      email,
      passwordHash: hashed,
      role_id: userRole._id,
      isActive: true,
      isFirstLogin: true,
      categories: [],
    });

    logger.info({ action: "register", email }, "User registered");
    return { message: "User registered successfully", user: { firstName: prenom, lastName: nom, email, role: userRole.nom } };
  }

  static async validateLogin({ email, mot_de_passe }) {
    if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true")
      throw new AppError(ErrorMessages[ErrorsCodes.LOCAL_LOGIN_DISABLED], 403, ErrorsCodes.LOCAL_LOGIN_DISABLED);

    if (!email || !mot_de_passe)
      throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    const user = await AuthService._findUserByLoginEmail(email);
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);
    if (!user.isActive) throw new AppError(ErrorMessages[ErrorsCodes.USER_DEACTIVATED], 403, ErrorsCodes.USER_DEACTIVATED);

    const role = user.role_id ? await Roles.findById(user.role_id) : null;
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_CONFIGURED], 500, ErrorsCodes.ROLE_NOT_CONFIGURED);

    const hash = getPasswordHash(user);
    if (!hash) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);
    const valid = await bcrypt.compare(mot_de_passe, hash);
    if (!valid) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);

    logger.info({ action: "login", email }, "User logged in");
    const { onboardingPending, isFirstLogin } = await AuthService._handleFirstLogin(String(user._id));
    return { user, role, onboardingPending, isFirstLogin };
  }

  /**
   * Validates email/password against Mongo only (bcrypt). Used when LDAP is off,
   * or as a fallback when LDAP is on but directory auth failed (e.g. manager only in DB).
   */
  static async validateLocalPasswordOnly({ email, mot_de_passe }) {
    if (!email || !mot_de_passe)
      throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    let user = await AuthService._findUserByLoginEmail(email);
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);
    if (!user.isActive) throw new AppError(ErrorMessages[ErrorsCodes.USER_DEACTIVATED], 403, ErrorsCodes.USER_DEACTIVATED);

    const role = user.role_id ? await Roles.findById(user.role_id) : null;
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_CONFIGURED], 500, ErrorsCodes.ROLE_NOT_CONFIGURED);

    const hash = getPasswordHash(user);
    if (!hash) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);
    const valid = await bcrypt.compare(mot_de_passe, hash);
    if (!valid) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);

    await Users.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
    user = await Users.findById(user._id);

    logger.info({ action: "login-mongo-fallback", email: user?.email }, "User logged in with Mongo password (LDAP failed or user not in directory)");
    const { onboardingPending, isFirstLogin } = await AuthService._handleFirstLogin(String(user._id));
    return { user, role, onboardingPending, isFirstLogin };
  }

  static async validateLdapLogin({ email, mot_de_passe }) {
    if (!email || !mot_de_passe)
      throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    const emailTrim = String(email).trim();
    const result    = await authenticateUser({ username: emailTrim, password: mot_de_passe });

    // LDAP auth failed — fallback to local password if LDAP_ENABLED
    if (!result.ok) {
      if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true") {
        try {
          return await AuthService.validateLocalPasswordOnly({ email: emailTrim, mot_de_passe });
        } catch {
          throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);
        }
      }
      throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);
    }

    const ldapUser = result.user;

    // ── 1. Detect role from DN ─────────────────────────────────────────────
    const roleNom    = _detectRoleFromDn(ldapUser.dn, emailTrim);
    const dbRole     = await Roles.findOne({ nom: roleNom });
    if (!dbRole)
      throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_INIT], 500, ErrorsCodes.ROLE_NOT_INIT);

    // ── 2. Resolve manager_id for regular users ────────────────────────────
    //    Only utilisateurs have a `manager` attribute in LDAP
    const managerId = roleNom === "utilisateur"
      ? await AuthService._resolveManagerId(ldapUser.managerDn)
      : null;

    // ── 3. Extract name fields from LDAP attributes ────────────────────────
    const firstName = ldapUser.givenName || (ldapUser.cn ? String(ldapUser.cn).split(" ")[0] : "LDAP");
    const lastName  = ldapUser.sn        || (ldapUser.cn ? String(ldapUser.cn).split(" ").slice(1).join(" ") : "User");

    // ── 4. Create or sync the user in MongoDB ─────────────────────────────
    let user = await AuthService._findUserByLoginEmail(emailTrim);

    if (!user) {
      // First LDAP login — create user with all resolved fields
      const hashed = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      const doc    = {
        firstName,
        lastName,
        email:        emailTrim,
        passwordHash: hashed,
        role_id:      dbRole._id,
        lastLoginAt:  new Date(),
        isActive:     true,
        isFirstLogin: true,
        categories:   [],
      };
      if (managerId) doc.manager_id = managerId;
      user = await Users.insertOne(doc);
      logger.info({ action: "login-ldap-create", email: emailTrim, role: roleNom, managerId }, "User auto-created from LDAP");
    } else {
      // Subsequent login — sync role and manager_id from LDAP on every login
      const update = { lastLoginAt: new Date(), role_id: dbRole._id };
      if (managerId) update.manager_id = managerId;
      await Users.updateOne({ _id: user._id }, { $set: update });
      user = await Users.findById(user._id);
      logger.info({ action: "login-ldap-sync", email: emailTrim, role: roleNom, managerId }, "User synced from LDAP");
    }

    if (!user.isActive)
      throw new AppError(ErrorMessages[ErrorsCodes.USER_DEACTIVATED], 403, ErrorsCodes.USER_DEACTIVATED);

    const role = await Roles.findById(user.role_id);
    if (!role)
      throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_CONFIGURED], 500, ErrorsCodes.ROLE_NOT_CONFIGURED);

    logger.info({ action: "login-ldap", email: emailTrim }, "User logged in via LDAP");
    const { onboardingPending, isFirstLogin } = await AuthService._handleFirstLogin(String(user._id));
    return { user, role, onboardingPending, isFirstLogin };
  }

  /** Generate and persist a new opaque refresh token. Returns the plain token. */
  static async createRefreshToken(userId) {
    const plain     = crypto.randomBytes(40).toString("hex");
    const hash      = crypto.createHash("sha256").update(plain).digest("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await RefreshTokens.create({ user_id: userId, token_hash: hash, expires_at: expiresAt });
    return plain;
  }

  /**
   * Validate an incoming refresh token, rotate it, and return a new access token + refresh token.
   *
   * Security flow:
   *   1. Look up the token regardless of revocation state.
   *   2. If the token exists but is already revoked → reuse detected → revoke ALL sessions for that user.
   *   3. If the token exists, is active but expired → AUTH-010.
   *   4. If the token is active and valid → revoke it, issue new pair (rotation).
   */
  static async refreshAccessToken(plainToken, jwtSign) {
    if (!plainToken)
      throw new AppError(ErrorMessages[ErrorsCodes.REFRESH_TOKEN_MISSING], 400, ErrorsCodes.REFRESH_TOKEN_MISSING);

    const hash   = crypto.createHash("sha256").update(plainToken).digest("hex");
    const stored = await RefreshTokens.findByHash(hash);

    if (!stored)
      throw new AppError(ErrorMessages[ErrorsCodes.REFRESH_TOKEN_INVALID], 401, ErrorsCodes.REFRESH_TOKEN_INVALID);

    if (stored.revoked_at !== null) {
      await RefreshTokens.revokeAllForUser(stored.user_id);
      logger.warn({ action: "token-reuse-detected", userId: stored.user_id }, "Refresh token reuse — all sessions revoked");
      throw new AppError(ErrorMessages[ErrorsCodes.REFRESH_TOKEN_REUSE], 401, ErrorsCodes.REFRESH_TOKEN_REUSE);
    }

    if (stored.expires_at < new Date())
      throw new AppError(ErrorMessages[ErrorsCodes.REFRESH_TOKEN_EXPIRED], 401, ErrorsCodes.REFRESH_TOKEN_EXPIRED);

    const user = await Users.findById(stored.user_id);
    if (!user || !user.isActive)
      throw new AppError(ErrorMessages[ErrorsCodes.REFRESH_TOKEN_INVALID], 401, ErrorsCodes.REFRESH_TOKEN_INVALID);

    const role = user.role_id ? await Roles.findById(user.role_id) : null;
    if (!role)
      throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_CONFIGURED], 500, ErrorsCodes.ROLE_NOT_CONFIGURED);

    await RefreshTokens.revokeById(stored._id);

    const uid          = String(user._id);
    const accessToken  = await jwtSign({ id: uid, email: user.email, role: role.nom, permissions: role.permissions || [] });
    const refreshToken = await AuthService.createRefreshToken(uid);

    logger.info({ action: "token-refresh", userId: uid }, "Tokens rotated");
    return {
      accessToken,
      refreshToken,
      user: {
        _id:         uid,
        firstName:   getFirstName(user),
        lastName:    getLastName(user),
        email:       user.email,
        role:        role.nom,
        permissions: role.permissions || [],
      },
    };
  }

  /** Revoke a single refresh token (logout from current device). */
  static async logout(plainToken) {
    if (!plainToken)
      throw new AppError(ErrorMessages[ErrorsCodes.REFRESH_TOKEN_MISSING], 400, ErrorsCodes.REFRESH_TOKEN_MISSING);

    const hash   = crypto.createHash("sha256").update(plainToken).digest("hex");
    const stored = await RefreshTokens.findActive(hash);

    if (!stored)
      throw new AppError(ErrorMessages[ErrorsCodes.REFRESH_TOKEN_INVALID], 401, ErrorsCodes.REFRESH_TOKEN_INVALID);

    await RefreshTokens.revokeById(stored._id);
    logger.info({ action: "logout", userId: stored.user_id }, "Token revoked");
  }

  /** Revoke all refresh tokens for the authenticated user (logout from all devices). */
  static async logoutAll(userId) {
    await RefreshTokens.revokeAllForUser(userId);
    logger.info({ action: "logout-all", userId }, "All tokens revoked");
  }
}

export default AuthService;
