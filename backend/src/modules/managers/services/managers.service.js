import bcrypt        from "bcrypt";
import { Users }     from "@/modules/users/models/User.model.js";
import { Roles }     from "@/modules/roles/models/Role.model.js";
import { HabitNoteHistories } from "@/modules/habits/models/HabitNoteHistory.model.js";
import HabitsService from "@/modules/habits/services/habits.service.js";
import { AppError }  from "@/core/errors.js";
import logger        from "@/utils/logger.util.js";
import { addLdapUser } from "@/modules/auth/services/ldap.service.js";
import { ErrorsCodes, ErrorMessages } from "../constants/managers.constants.js";
import { withCanonicalUserFields } from "@/modules/users/utils/user-fields.js";

class ManagersService {
  /** When LDAP is on, `/login` only checks LDAP — mirror DB-only users into the directory (same as admin user create). */
  static async _syncUserToLdapIfEnabled({ mot_de_passe, prenom, nom, email }) {
    if (String(process.env.LDAP_ENABLED || "false").toLowerCase() !== "true") return;
    try {
      await addLdapUser({ password: mot_de_passe, firstName: prenom, lastName: nom, email });
    } catch (e) {
      logger.warn({ action: "ldap-sync", email }, "LDAP sync failed: " + e.message);
    }
  }

  // ─── Shared helpers ────────────────────────────────────────────────────────

  static sanitize(user) {
    if (!user) return user;
    return withCanonicalUserFields(user);
  }

  static async withRole(user) {
    if (!user) return user;
    const role = user.role_id ? await Roles.findById(user.role_id) : null;
    return { ...ManagersService.sanitize(user), role };
  }

  static async _getManagerRole() {
    const role = await Roles.findOne({ nom: "manager" });
    if (!role) throw new AppError("Le rôle manager n'existe pas", 500, "MGR-000");
    return role;
  }

  static async _getUserRole() {
    let role = await Roles.findOne({ nom: "utilisateur" });
    if (!role) {
      role = await Roles.insertOne({ nom: "utilisateur", description: "Rôle utilisateur par défaut", permissions: ["SELF_VIEW", "SELF_EDIT"] });
    }
    return role;
  }

  // ─── Admin: manage managers ─────────────────────────────────────────────────

  static async getManagers() {
    const managerRole = await ManagersService._getManagerRole();
    const managers    = await Users.find({ role_id: managerRole._id, is_system: { $ne: true } });
    return Promise.all(
      managers.map(async (m) => {
        const base = await ManagersService.withRole(m);
        const [managedUsersCount, managedUsersActive] = await Promise.all([
          Users.countDocuments({ manager_id: m._id, anonymized: { $ne: true } }),
          Users.countDocuments({ manager_id: m._id, anonymized: { $ne: true }, isActive: true }),
        ]);
        return { ...base, managedUsersCount, managedUsersActive };
      })
    );
  }

  static async assertIsManager(managerId) {
    const manager = await Users.findById(managerId);
    if (!manager) throw new AppError(ErrorMessages[ErrorsCodes.MANAGER_NOT_FOUND], 404, ErrorsCodes.MANAGER_NOT_FOUND);
    const managerRole = await ManagersService._getManagerRole();
    if (String(manager.role_id) !== String(managerRole._id))
      throw new AppError(ErrorMessages[ErrorsCodes.NOT_A_MANAGER], 400, ErrorsCodes.NOT_A_MANAGER);
    return manager;
  }

  /** Admin read-only: users assigned to a given manager account. */
  static async getManagerTeamForAdmin(managerId) {
    await ManagersService.assertIsManager(managerId);
    return ManagersService.getManagerUsers(managerId);
  }

  static async createManager(body) {
    const { nom, prenom, email, mot_de_passe, departement } = body;
    if (!nom || !prenom || !email || !mot_de_passe)
      throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    if (await Users.findOne({ email }))
      throw new AppError(ErrorMessages[ErrorsCodes.EMAIL_IN_USE], 400, ErrorsCodes.EMAIL_IN_USE);

    const managerRole = await ManagersService._getManagerRole();
    const hashed      = await bcrypt.hash(mot_de_passe, 10);
    const manager     = await Users.insertOne({
      firstName: prenom,
      lastName: nom,
      email,
      passwordHash: hashed,
      role_id:      managerRole._id,
      department:   departement || "",
      isActive:     true,
    });

    await ManagersService._syncUserToLdapIfEnabled({ mot_de_passe, prenom, nom, email });

    logger.info({ action: "create-manager", email }, "Manager created");
    return ManagersService.withRole(manager);
  }

  static async updateManager(id, body) {
    const manager = await Users.findById(id);
    if (!manager) throw new AppError(ErrorMessages[ErrorsCodes.MANAGER_NOT_FOUND], 404, ErrorsCodes.MANAGER_NOT_FOUND);

    const managerRole = await ManagersService._getManagerRole();
    if (String(manager.role_id) !== String(managerRole._id))
      throw new AppError(ErrorMessages[ErrorsCodes.NOT_A_MANAGER], 400, ErrorsCodes.NOT_A_MANAGER);

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

    const updated = await Users.updateOne({ _id: id }, { $set: update });
    if (!updated) throw new AppError(ErrorMessages[ErrorsCodes.MANAGER_NOT_FOUND], 404, ErrorsCodes.MANAGER_NOT_FOUND);
    return ManagersService.withRole(updated);
  }

  static async deleteManager(id, requesterId) {
    if (id === requesterId)
      throw new AppError(ErrorMessages[ErrorsCodes.CANNOT_DELETE_SELF], 400, ErrorsCodes.CANNOT_DELETE_SELF);

    const manager = await Users.findById(id);
    if (!manager) throw new AppError(ErrorMessages[ErrorsCodes.MANAGER_NOT_FOUND], 404, ErrorsCodes.MANAGER_NOT_FOUND);

    const managerRole = await ManagersService._getManagerRole();
    if (String(manager.role_id) !== String(managerRole._id))
      throw new AppError(ErrorMessages[ErrorsCodes.NOT_A_MANAGER], 400, ErrorsCodes.NOT_A_MANAGER);

    // Orphan the manager's users (remove manager_id binding)
    await Users.updateMany({ manager_id: id }, { $unset: { manager_id: "" } });

    await Users.deleteOne({ _id: id });
    logger.info({ action: "delete-manager", id }, "Manager deleted");
  }

  // ─── Manager: manage own users ──────────────────────────────────────────────

  static async getManagerUsers(managerId) {
    const users = await Users.find({ manager_id: managerId, anonymized: { $ne: true } });
    return Promise.all(users.map(ManagersService.withRole));
  }

  static async getManagerUsersNotes(managerId, query = {}) {
    const page = parseInt(query?.page, 10) || 1;
    const limit = parseInt(query?.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const search = (query?.search || "").trim();

    const teamUsers = await Users.find(
      { manager_id: managerId, anonymized: { $ne: true } },
      { projection: { _id: 1 } }
    );
    const userIds = teamUsers.map((u) => u._id);
    if (userIds.length === 0) {
      return { data: [], pagination: { page, limit, total: 0, pages: 0 } };
    }

    const filter = { user_id: { $in: userIds } };
    if (search) filter.note_text = { $regex: search, $options: "i" };

    const [data, total] = await Promise.all([
      HabitNoteHistories.find(filter, { sort: { createdAt: -1 }, skip, limit }),
      HabitNoteHistories.count(filter),
    ]);
    const hydrated = await HabitsService._hydrateNotesEntries(data);
    return { data: hydrated, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  static async createManagerUser(body, managerId) {
    const { nom, prenom, email, mot_de_passe, departement } = body;
    if (!nom || !prenom || !email || !mot_de_passe)
      throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    if (await Users.findOne({ email }))
      throw new AppError(ErrorMessages[ErrorsCodes.EMAIL_IN_USE], 400, ErrorsCodes.EMAIL_IN_USE);

    const userRole = await ManagersService._getUserRole();
    const hashed   = await bcrypt.hash(mot_de_passe, 10);
    const user     = await Users.insertOne({
      firstName: prenom,
      lastName: nom,
      email,
      passwordHash: hashed,
      role_id:      userRole._id,
      department:   departement || "",
      manager_id:   managerId,
      isActive:     true,
    });

    await ManagersService._syncUserToLdapIfEnabled({ mot_de_passe, prenom, nom, email });

    logger.info({ action: "manager-create-user", managerId, email }, "User created by manager");
    return ManagersService.withRole(user);
  }

  static async updateManagerUser(userId, body, managerId) {
    const user = await Users.findById(userId);
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_FOUND], 404, ErrorsCodes.USER_NOT_FOUND);
    if (user.manager_id !== managerId)
      throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_OWNED], 403, ErrorsCodes.USER_NOT_OWNED);

    const { nom, prenom, email, departement, isActive } = body;
    if (email) {
      const conflict = await Users.findOne({ email, _id: { $ne: userId } });
      if (conflict) throw new AppError(ErrorMessages[ErrorsCodes.EMAIL_IN_USE], 400, ErrorsCodes.EMAIL_IN_USE);
    }

    const update = {};
    if (nom         !== undefined) update.lastName   = nom;
    if (prenom      !== undefined) update.firstName  = prenom;
    if (email       !== undefined) update.email      = email;
    if (departement !== undefined) update.department = departement;
    if (isActive    !== undefined) update.isActive   = !!isActive;

    const updated = await Users.updateOne({ _id: userId }, { $set: update });
    if (!updated) throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_FOUND], 404, ErrorsCodes.USER_NOT_FOUND);
    return ManagersService.withRole(updated);
  }

  static async deleteManagerUser(userId, managerId) {
    const user = await Users.findById(userId);
    if (!user) throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_FOUND], 404, ErrorsCodes.USER_NOT_FOUND);
    if (user.manager_id !== managerId)
      throw new AppError(ErrorMessages[ErrorsCodes.USER_NOT_OWNED], 403, ErrorsCodes.USER_NOT_OWNED);

    await Users.deleteOne({ _id: userId });
    logger.info({ action: "manager-delete-user", managerId, userId }, "User deleted by manager");
  }
}

export default ManagersService;
