import { Roles }    from "../models/Role.model.js";
import { AppError } from "@/core/errors.js";
import logger       from "@/utils/logger.util.js";
import { ErrorsCodes, ErrorMessages } from "../constants/roles.constants.js";

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

  static async deleteRole(id) {
    const role = await Roles.findById(id);
    if (!role) throw new AppError(ErrorMessages[ErrorsCodes.ROLE_NOT_FOUND], 404, ErrorsCodes.ROLE_NOT_FOUND);
    if (role.nom === "admin") throw new AppError(ErrorMessages[ErrorsCodes.CANNOT_DELETE_ADMIN], 400, ErrorsCodes.CANNOT_DELETE_ADMIN);
    await Roles.deleteOne({ _id: id });
  }
}

export default RolesService;
