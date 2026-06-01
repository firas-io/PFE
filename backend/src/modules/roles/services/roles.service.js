import { Roles }    from "../models/Role.model.js";
import { AppError } from "@/core/errors.js";
import logger       from "@/utils/logger.util.js";
import { ErrorsCodes, ErrorMessages, VALID_PERMISSIONS, MAX_PERMISSIONS_BY_ROLE } from "../constants/roles.constants.js";
import { invalidateRoleCache } from "@/plugins/auth.plugin.js";

class RolesService {
  static async getRoles() { return Roles.find(); }

  static async createRole(body) {
    const { nom, description, permissions = [] } = body;
    const invalid = permissions.filter(p => !VALID_PERMISSIONS.has(p));
    if (invalid.length)
      throw new AppError(`${ErrorMessages[ErrorsCodes.INVALID_PERMISSION]}: ${invalid.join(", ")}`, 400, ErrorsCodes.INVALID_PERMISSION);
    logger.info({ action: "create-role", nom }, "Role created");
    return Roles.insertOne({ nom, description, permissions });
  }

  static async updateRole(id, body) {
    const role = await Roles.findById(id);
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 404, ErrorsCodes.ROLE_NOT_FOUND);
    if (role.nom === "admin")
      throw new AppError(ErrorMessages[ErrorsCodes.CANNOT_MUTATE_ADMIN], 400, ErrorsCodes.CANNOT_MUTATE_ADMIN);

    // Seuls nom et description sont modifiables via cette route — jamais les permissions
    const { nom, description } = body;
    const patch = {};
    if (nom         !== undefined) patch.nom         = nom;
    if (description !== undefined) patch.description = description;

    const updated = await Roles.updateOne({ _id: id }, { $set: patch });
    if (!updated) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 404, ErrorsCodes.ROLE_NOT_FOUND);
    return updated;
  }

  static async updateRolePermissions(id, permissions) {
    if (!Array.isArray(permissions))
      throw new AppError("permissions doit être un tableau de strings", 400, "ROLE-005");

    const role = await Roles.findById(id);
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 404, ErrorsCodes.ROLE_NOT_FOUND);
    if (role.nom === "admin")
      throw new AppError(ErrorMessages[ErrorsCodes.CANNOT_MUTATE_ADMIN], 400, ErrorsCodes.CANNOT_MUTATE_ADMIN);

    const invalid = permissions.filter(p => !VALID_PERMISSIONS.has(p));
    if (invalid.length)
      throw new AppError(`${ErrorMessages[ErrorsCodes.INVALID_PERMISSION]}: ${invalid.join(", ")}`, 400, ErrorsCodes.INVALID_PERMISSION);

    // Vérifier que les permissions ne dépassent pas le set maximum du rôle
    const maxSet = MAX_PERMISSIONS_BY_ROLE[role.nom];
    if (maxSet) {
      const exceeded = permissions.filter(p => !maxSet.has(p));
      if (exceeded.length)
        throw new AppError(
          `Permissions non autorisées pour le rôle "${role.nom}": ${exceeded.join(", ")}`,
          400,
          ErrorsCodes.INVALID_PERMISSION
        );
    }

    const updated = await Roles.updateOne({ _id: id }, { $set: { permissions, updatedAt: new Date() } });
    invalidateRoleCache(id);
    logger.info({ action: "update-role-permissions", roleId: id }, "Role permissions updated");
    return updated;
  }

  static async deleteRole(id) {
    const role = await Roles.findById(id);
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 404, ErrorsCodes.ROLE_NOT_FOUND);
    if (role.nom === "admin")
      throw new AppError(ErrorMessages[ErrorsCodes.CANNOT_DELETE_ADMIN], 400, ErrorsCodes.CANNOT_DELETE_ADMIN);
    invalidateRoleCache(id);
    await Roles.deleteOne({ _id: id });
  }
}

export default RolesService;
