import { Roles }    from "../models/Role.model.js";
import { AppError } from "@/core/errors.js";
import logger       from "@/utils/logger.util.js";
import { ErrorsCodes, ErrorMessages } from "../constants/roles.constants.js";
import { invalidateRoleCache } from "@/plugins/auth.plugin.js";

class RolesService {
  static async getRoles()       { return Roles.find(); }
  static async createRole(body) {
    logger.info({ action: "create-role", nom: body.nom }, "Role created");
    return Roles.insertOne(body);
  }

  static async updateRole(id, body) {
    const role = await Roles.updateOne({ _id: id }, { $set: body });
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 404, ErrorsCodes.ROLE_NOT_FOUND);
    return role;
  }

  static async updateRolePermissions(id, permissions) {
    if (!Array.isArray(permissions))
      throw new AppError("permissions doit être un tableau de strings", 400, "ROLE-005");
    const role = await Roles.findById(id);
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 404, ErrorsCodes.ROLE_NOT_FOUND);
    if (role.nom === "admin")
      throw new AppError("Les permissions du rôle admin ne peuvent pas être modifiées", 400, "ROLE-006");
    const updated = await Roles.updateOne({ _id: id }, { $set: { permissions, updated_at: new Date() } });
    // Invalidate the in-memory cache so the next request fetches fresh permissions
    invalidateRoleCache(id);
    logger.info({ action: "update-role-permissions", roleId: id }, "Role permissions updated");
    return updated;
  }

  static async deleteRole(id) {
    const role = await Roles.findById(id);
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 404, ErrorsCodes.ROLE_NOT_FOUND);
    if (role.nom === "admin") throw new AppError(ErrorMessages[ErrorsCodes.CANNOT_DELETE_ADMIN], 400, ErrorsCodes.CANNOT_DELETE_ADMIN);
    invalidateRoleCache(id);
    await Roles.deleteOne({ _id: id });
  }
}

export default RolesService;
