import bcrypt          from "bcrypt";
import crypto          from "crypto";
import { Users }       from "@/modules/users/models/User.model.js";
import { Roles }       from "@/modules/roles/models/Role.model.js";
import { Onboardings } from "@/modules/onboarding/models/Onboarding.model.js";
import { AppError }    from "@/core/errors.js";
import logger          from "@/utils/logger.util.js";
import { authenticateUser, lookupUserByDn } from "./ldap.service.js";
import { ErrorsCodes, ErrorMessages } from "../constants/auth.constants.js";
import { getFirstName, getLastName, getPasswordHash } from "@/modules/users/utils/user-fields.js";

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

    logger.info({ action: "login-mongo-fallback", email: user?.email }, "User logged in with Mongo password (LDAP failed or user not in directory)");
    const { onboardingPending, isFirstLogin } = await AuthService._handleFirstLogin(String(user._id));
    return { user, role, onboardingPending, isFirstLogin };
  }

  static async validateLdapLogin({ email, mot_de_passe }) {
    if (!email || !mot_de_passe)
      throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    const emailTrim = String(email).trim();
    const result    = await authenticateUser({ username: emailTrim, password: mot_de_passe });

    // LDAP auth failed — fallback to local Mongo password (e.g. admin@habitflow.com)
    if (!result.ok) {
      if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true") {
        try {
          return await AuthService.validateLocalPasswordOnly({ email: emailTrim, mot_de_passe });
        } catch {
          if (result.reason === "LDAP_UNAVAILABLE") {
            throw new AppError(
              ErrorMessages[ErrorsCodes.LDAP_UNAVAILABLE],
              503,
              ErrorsCodes.LDAP_UNAVAILABLE
            );
          }
          throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);
        }
      }
      throw new AppError(ErrorMessages[ErrorsCodes.INVALID_CREDENTIALS], 401, ErrorsCodes.INVALID_CREDENTIALS);
    }

    const ldapUser = result.user;

    // ── Create the user in MongoDB only on first LDAP login ────────────────
    let user = await AuthService._findUserByLoginEmail(emailTrim);

    if (!user) {
      const roleNom = _detectRoleFromDn(ldapUser.dn, emailTrim);
      const dbRole  = await Roles.findOne({ nom: roleNom });
      if (!dbRole)
        throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_INIT], 500, ErrorsCodes.ROLE_NOT_INIT);

      const managerId = roleNom === "utilisateur"
        ? await AuthService._resolveManagerId(ldapUser.managerDn)
        : null;

      const firstName = ldapUser.givenName || (ldapUser.cn ? String(ldapUser.cn).split(" ")[0] : "LDAP");
      const lastName  = ldapUser.sn        || (ldapUser.cn ? String(ldapUser.cn).split(" ").slice(1).join(" ") : "User");

      // First LDAP login — create user with all resolved fields
      const hashed = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      const doc    = {
        firstName,
        lastName,
        email:        emailTrim,
        passwordHash: hashed,
        role_id:      dbRole._id,
        isActive:     true,
        isFirstLogin: true,
        categories:   [],
      };
      if (managerId) doc.manager_id = managerId;
      user = await Users.insertOne(doc);
      logger.info({ action: "login-ldap-create", email: emailTrim, role: roleNom, managerId }, "User auto-created from LDAP");
    } else {
      logger.info({ action: "login-ldap-existing", email: emailTrim }, "Existing LDAP user logged in without MongoDB sync");
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

}

export default AuthService;
