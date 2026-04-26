import bcrypt                from "bcrypt";
import { Users }             from "../models/User.model.js";
import { Roles }             from "@/modules/roles/models/Role.model.js";
import { addLdapUser }       from "@/modules/auth/services/ldap.service.js";
import { RefreshTokens }     from "@/modules/auth/models/RefreshToken.model.js";
import { Sessions }          from "@/modules/sessions/models/Session.model.js";
import { Onboardings }       from "@/modules/onboarding/models/Onboarding.model.js";
import { WeeklyRecaps }      from "@/modules/weekly-recap/models/WeeklyRecap.model.js";
import { HabitNoteHistories } from "@/modules/habits/models/HabitNoteHistory.model.js";
import { Reminders }         from "@/modules/reminders/models/Reminder.model.js";
import { HabitStats }        from "@/modules/habit-stats/models/HabitStats.model.js";
import { HabitLogs }         from "@/modules/habit-logs/models/HabitLog.model.js";
import { Habits }            from "@/modules/habits/models/Habit.model.js";
import { CategoryTickets }   from "@/modules/category-tickets/models/CategoryTicket.model.js";
import { AppError }          from "@/core/errors.js";
import logger                from "@/utils/logger.util.js";
import { ErrorsCodes, ErrorMessages, SYSTEM_ARCHIVED_USER_ID } from "../constants/users.constants.js";
import { withCanonicalUserFields } from "../utils/user-fields.js";

class UsersService {
  static sanitize(user) {
    if (!user) return user;
    return withCanonicalUserFields(user);
  }

  static async withRole(user) {
    if (!user) return user;
    const role = user.role_id ? await Roles.findById(user.role_id) : null;
    return { ...UsersService.sanitize(user), role };
  }

  static async _getDefaultUserRole() {
    let role = await Roles.findOne({ nom: "utilisateur" });
    if (!role) {
      role = await Roles.insertOne({ nom: "utilisateur", description: "Rôle utilisateur par défaut", permissions: ["SELF_VIEW", "SELF_EDIT"] });
    }
    return role;
  }

  static async createUser(body) {
    const { mot_de_passe, role: _role, nom, prenom, email, ...rest } = body;
    if (!mot_de_passe) throw new AppError(ErrorMessages[ErrorsCodes.PASSWORD_REQUIRED], 400, ErrorsCodes.PASSWORD_REQUIRED);

    const userRole = await UsersService._getDefaultUserRole();
    const hashed   = await bcrypt.hash(mot_de_passe, 10);
    const user     = await Users.insertOne({
      ...rest,
      firstName: prenom,
      lastName: nom,
      email,
      passwordHash: hashed,
      role_id: userRole._id,
      isActive: true,
    });

    if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true") {
      try { await addLdapUser({ password: mot_de_passe, firstName: prenom, lastName: nom, email }); }
      catch (e) { logger.warn({ action: "ldap-sync", email }, "Failed to sync user to LDAP: " + e.message); }
    }

    logger.info({ action: "create-user", email }, "User created");
    return UsersService.sanitize(user);
  }

  static async getUsers(managerId = null) {
    const filter = { anonymized: { $ne: true }, is_system: { $ne: true } };
    if (managerId) filter.manager_id = managerId;
    const users = await Users.find(filter);
    return Promise.all(users.map(UsersService.withRole));
  }

  static async getUserById(id, requesterId, permissions) {
    if (id !== requesterId && !permissions.includes("USERS_VIEW") && !permissions.includes("ALL"))
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const user = await Users.findById(id);
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_FOUND], 404, ErrorsCodes.USER_NOT_FOUND);
    return UsersService.withRole(user);
  }

  static async updateUserRole(id, roleNom) {
    const roleDoc = await Roles.findOne({ nom: roleNom });
    if (!roleDoc) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 400, ErrorsCodes.ROLE_NOT_FOUND);

    const user = await Users.updateOne({ _id: id }, { $set: { role_id: roleDoc._id } });
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_FOUND], 404, ErrorsCodes.USER_NOT_FOUND);
    return { message: "Rôle mis à jour", user: await UsersService.withRole(user) };
  }

  static async anonymizeUser(id, requesterId, requesterRole, permissions) {
    // ─ 0. Authorization ───────────────────────────────────────────────────────
    const isAdmin = permissions.includes("USERS_MANAGE") || permissions.includes("ALL");
    if (id !== requesterId && !isAdmin)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const user = await Users.findById(id);
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_FOUND], 404, ErrorsCodes.USER_NOT_FOUND);
    if (user.anonymized === true) throw new AppError(ErrorMessages[ErrorsCodes.ALREADY_ANONYMIZED], 400, ErrorsCodes.ALREADY_ANONYMIZED);

    // Admin cannot anonymize their own account
    if (id === requesterId && requesterRole === "admin")
      throw new AppError(ErrorMessages[ErrorsCodes.SELF_DELETE_ADMIN], 400, ErrorsCodes.SELF_DELETE_ADMIN);

    // ─ 1. Collect private habit IDs BEFORE any write ─────────────────────────
    const privateHabits    = await Habits.find({ user_id: id, visible_pour_tous: { $ne: true } }, { projection: { _id: 1 } });
    const privateHabitIds  = privateHabits.map(h => h._id);

    // ─ 2. Cascade — children first, user document LAST ───────────────────────
    const counts = {
      tokens_revoked: 0, sessions_purged: 0, onboardings_purged: 0,
      recaps_purged: 0, notes_purged: 0, reminders_purged: 0,
      stats_purged: 0, logs_purged: 0, habits_private_deleted: 0,
      habits_shared_reassigned: 0, logs_anonymized: 0, tickets_anonymized: 0,
    };

    const STEPS = [
      {
        name: "refresh_tokens", key: "tokens_revoked",
        run: async () => {
          const r = await RefreshTokens.revokeAllForUser(id);
          return r.modifiedCount ?? 0;
        },
      },
      {
        name: "sessions", key: "sessions_purged",
        run: async () => {
          const r = await Sessions.deleteMany({ user_id: id });
          return r.deletedCount ?? 0;
        },
      },
      {
        name: "onboardings", key: "onboardings_purged",
        run: async () => {
          const r = await Onboardings.deleteMany({ user_id: id });
          return r.deletedCount ?? 0;
        },
      },
      {
        name: "weekly_recaps", key: "recaps_purged",
        run: async () => {
          const r = await WeeklyRecaps.deleteMany({ user_id: id });
          return r.deletedCount ?? 0;
        },
      },
      {
        name: "habit_note_histories", key: "notes_purged",
        run: async () => {
          const r = await HabitNoteHistories.deleteMany({ user_id: id });
          return r.deletedCount ?? 0;
        },
      },
      {
        name: "reminders", key: "reminders_purged",
        run: async () => {
          const r = await Reminders.deleteMany({ user_id: id });
          return r.deletedCount ?? 0;
        },
      },
      {
        name: "habit_stats", key: "stats_purged",
        run: async () => {
          if (privateHabitIds.length === 0) return 0;
          const r = await HabitStats.deleteMany({ habit_id: { $in: privateHabitIds } });
          return r.deletedCount ?? 0;
        },
      },
      {
        name: "habit_logs_private", key: "logs_purged",
        run: async () => {
          if (privateHabitIds.length === 0) return 0;
          const r = await HabitLogs.deleteMany({ habit_id: { $in: privateHabitIds } });
          return r.deletedCount ?? 0;
        },
      },
      {
        name: "habits_private", key: "habits_private_deleted",
        run: async () => {
          const r = await Habits.deleteMany({ user_id: id, visible_pour_tous: { $ne: true } });
          return r.deletedCount ?? 0;
        },
      },
      {
        name: "habits_shared", key: "habits_shared_reassigned",
        run: async () => {
          const r = await Habits.updateMany(
            { user_id: id, visible_pour_tous: true },
            { $set: { user_id: SYSTEM_ARCHIVED_USER_ID } }
          );
          return r.modifiedCount ?? 0;
        },
      },
      {
        // Only shared-habit logs remain here — private logs already purged above
        name: "habit_logs_shared", key: "logs_anonymized",
        run: async () => {
          const r = await HabitLogs.updateMany(
            { user_id: id },
            { $set: { photo_url: null, notes: null } }
          );
          return r.modifiedCount ?? 0;
        },
      },
      {
        name: "category_tickets", key: "tickets_anonymized",
        run: async () => {
          const r = await CategoryTickets.updateMany(
            { user_id: id },
            { $set: { description: "[anonymized]" } }
          );
          return r.modifiedCount ?? 0;
        },
      },
    ];

    for (const step of STEPS) {
      try {
        counts[step.key] = await step.run();
      } catch (err) {
        logger.warn(
          { action: "anonymize-user", step: step.name, id, by: requesterId, progress: counts, error: err.message },
          "Anonymization partial failure — user document preserved"
        );
        const partialErr = new AppError(
          `${ErrorMessages[ErrorsCodes.ANONYMIZE_PARTIAL]} (stopped at "${step.name}": ${err.message})`,
          500,
          ErrorsCodes.ANONYMIZE_PARTIAL
        );
        partialErr.partial = { anonymized: { user: 0, ...counts }, failed_at: step.name };
        throw partialErr;
      }
    }

    // ─ 3. Anonymize user document — point of no return ────────────────────────
    await Users.updateOne({ _id: id }, {
      $set: {
        email:          null,
        lastName:       "[deleted]",
        firstName:      "[deleted]",
        passwordHash:   null,
        mot_de_passe:   null,
        ldap_dn:        null,
        isActive:       false,
        anonymized:     true,
        anonymized_at:  new Date(),
      },
    });

    logger.info(
      { action: "anonymize-user", id, by: requesterId, counts },
      "User anonymized — all PII purged"
    );

    return { anonymized: { user: 1, ...counts } };
  }

  // Backward-compat alias — callers using deleteUser continue to work.
  static async deleteUser(id, requesterId, requesterRole, permissions) {
    return UsersService.anonymizeUser(id, requesterId, requesterRole, permissions);
  }

  static async adminCreateUser(body) {
    const { nom, prenom, email, mot_de_passe, roleNom, departement } = body;
    if (!nom || !prenom || !email || !mot_de_passe || !roleNom)
      throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    if (await Users.findOne({ email }))
      throw new AppError(ErrorMessages[ErrorsCodes.EMAIL_IN_USE], 400, ErrorsCodes.EMAIL_IN_USE);

    const roleDoc = await Roles.findOne({ nom: roleNom });
    if (!roleDoc) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 400, ErrorsCodes.ROLE_NOT_FOUND);

    const hashed = await bcrypt.hash(mot_de_passe, 10);
    const user   = await Users.insertOne({
      firstName: prenom,
      lastName: nom,
      email,
      passwordHash: hashed,
      role_id: roleDoc._id,
      department: departement || "",
      isActive: true,
    });

    if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true") {
      try { await addLdapUser({ password: mot_de_passe, firstName: prenom, lastName: nom, email }); }
      catch (e) { logger.warn({ action: "ldap-sync", email }, "LDAP sync failed: " + e.message); }
    }

    return UsersService.withRole(user);
  }

  static async updateUser(id, body, requesterId, permissions) {
    const isAdmin = permissions.includes("USERS_MANAGE") || permissions.includes("ALL");
    if (id !== requesterId && !isAdmin) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const { nom, prenom, email, departement } = body;
    if (email) {
      const conflict = await Users.findOne({ email, _id: { $ne: id } });
      if (conflict) throw new AppError(ErrorMessages[ErrorsCodes.EMAIL_IN_USE], 400, ErrorsCodes.EMAIL_IN_USE);
    }

    const update = {};
    if (nom         !== undefined) update.lastName   = nom;
    if (prenom      !== undefined) update.firstName  = prenom;
    if (email       !== undefined) update.email      = email;
    if (departement !== undefined) update.department = departement;

    const user = await Users.updateOne({ _id: id }, { $set: update });
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_FOUND], 404, ErrorsCodes.USER_NOT_FOUND);
    return UsersService.withRole(user);
  }

  static async updateUserStatus(id, isActive, requesterId) {
    if (typeof isActive !== "boolean") throw new AppError(ErrorMessages[ErrorsCodes.INVALID_ACTIVE], 400, ErrorsCodes.INVALID_ACTIVE);

    const user = await Users.findById(id);
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_FOUND], 404, ErrorsCodes.USER_NOT_FOUND);

    if (id === requesterId && !isActive)
      throw new AppError(ErrorMessages[ErrorsCodes.SELF_DEACTIVATE], 400, ErrorsCodes.SELF_DEACTIVATE);

    const updated = await Users.updateOne({ _id: id }, { $set: { isActive } });
    return { message: isActive ? "User activated" : "User deactivated", user: await UsersService.withRole(updated) };
  }
}

export default UsersService;
