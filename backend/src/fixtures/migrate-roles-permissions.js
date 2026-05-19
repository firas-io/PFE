import { Roles } from "@/modules/roles/models/Role.model.js";
import logger from "@/utils/logger.util.js";

export async function migrateRolesPermissions() {
  try {
    const roles = await Roles.find({});
    let updated = 0;
    for (const role of roles) {
      const patch = {};
      if (!Array.isArray(role.permissions)) patch.permissions = [];
      if (!role.updated_at) patch.updated_at = new Date();
      if (Object.keys(patch).length > 0) {
        await Roles.updateOne({ _id: role._id }, { $set: patch });
        updated++;
      }
    }
    if (updated > 0) {
      logger.info({ action: "migrate-roles-permissions", count: updated }, "Roles permissions/updated_at fields ensured");
    }

    // Manager role must include HABITS_CREATE (aligns with setup-admin MANAGER_PERMISSIONS).
    const managerRole = await Roles.findOne({ nom: "manager" });
    if (managerRole && Array.isArray(managerRole.permissions) && !managerRole.permissions.includes("HABITS_CREATE")) {
      await Roles.updateOne({ _id: managerRole._id }, { $addToSet: { permissions: "HABITS_CREATE" } });
      logger.info({ action: "migrate-roles-permissions", role: "manager" }, "Added missing HABITS_CREATE to manager role");
    }

    const userRole = await Roles.findOne({ nom: "utilisateur" });
    if (userRole && Array.isArray(userRole.permissions)) {
      const userPermsToAdd = ["OFFDAYS_VIEW", "HABITS_CREATE"].filter((p) => !userRole.permissions.includes(p));
      if (userPermsToAdd.length > 0) {
        await Roles.updateOne({ _id: userRole._id }, { $addToSet: { permissions: { $each: userPermsToAdd } } });
        logger.info({ action: "migrate-roles-permissions", role: "utilisateur", added: userPermsToAdd }, "Added missing permissions to utilisateur role");
      }
    }
  } catch (err) {
    logger.error({ err }, "migrateRolesPermissions failed");
  }
}
