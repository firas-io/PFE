import bcrypt from "bcrypt";
import { Users } from "@/modules/users/models/User.model.js";
import { Roles } from "@/modules/roles/models/Role.model.js";
import { SYSTEM_ARCHIVED_USER_ID } from "@/modules/users/constants/users.constants.js";

const ADMIN_PERMISSIONS = [
  "MANAGERS_MANAGE",
  "MANAGER_TEAM_VIEW",
  "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
  "ROLES_VIEW", "ROLES_MANAGE",
  "USERS_VIEW", "USERS_MANAGE",
  "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
  "LOGS_VIEW", "LOGS_MANAGE",
  "STATS_VIEW", "STATS_MANAGE",
  "ONBOARDING_VIEW", "ONBOARDING_MANAGE",
  "REMINDERS_VIEW", "REMINDERS_MANAGE",
  "SESSIONS_VIEW", "SESSIONS_MANAGE",
  "ADMIN_STATS_VIEW",
  "OFFDAYS_VIEW", "OFF_DAYS_MANAGE",
  "TICKETS_MANAGE",
  "CATEGORIES_VIEW", "CATEGORIES_MANAGE",
];

const DEFAULT_ROLES = [
  {
    nom: "admin",
    description: "Gestion des managers, consultation des équipes, pilotage applicatif",
    permissions: ADMIN_PERMISSIONS,
  },
  {
    nom: "manager",
    description: "Responsable d'équipe — gère ses propres utilisateurs",
    permissions: [
      "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
      "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
      "LOGS_VIEW", "LOGS_MANAGE",
      "PROGRESS_VIEW",
      "ONBOARDING_VIEW",
      "REMINDERS_VIEW",
      "SESSIONS_VIEW",
      "OFFDAYS_VIEW",
      "STATS_VIEW",
    ]
  },
  {
    nom: "utilisateur",
    description: "Utilisateur standard",
    permissions: [
      "SELF_VIEW", "SELF_EDIT",
      "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
      "LOGS_VIEW", "LOGS_MANAGE",
      "PROGRESS_VIEW",
      "ONBOARDING_VIEW",
      "REMINDERS_VIEW",
      "SESSIONS_VIEW"
    ]
  }
];

const MANAGER_PERMISSIONS = [
  "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
  "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
  "LOGS_VIEW", "LOGS_MANAGE",
  "PROGRESS_VIEW",
  "ONBOARDING_VIEW",
  "REMINDERS_VIEW",
  "SESSIONS_VIEW",
  "OFFDAYS_VIEW",
  "STATS_VIEW",
];

const USER_PERMISSIONS = [
  "SELF_VIEW", "SELF_EDIT",
  "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
  "LOGS_VIEW", "LOGS_MANAGE",
  "PROGRESS_VIEW",
  "ONBOARDING_VIEW",
  "REMINDERS_VIEW",
  "SESSIONS_VIEW",
];

export async function setupAdmin(fastify) {
  try {
    // 1. Ensure default roles exist (idempotent — never overwrites existing ones)
    for (const roleData of DEFAULT_ROLES) {
      const existing = await Roles.findOne({ nom: roleData.nom });
      if (!existing) {
        await Roles.insertOne(roleData);
        fastify.log.info(`Role created: ${roleData.nom}`);
      }
    }

    // Align default role permissions on each boot — use the returned document directly
    // to avoid any ambiguity from a subsequent findOne in a dirty-state collection.
    const adminRole = await Roles.updateOne(
      { nom: "admin" },
      { $set: { permissions: ADMIN_PERMISSIONS, description: "Gestion des managers, consultation des équipes, pilotage applicatif" } }
    );
    await Roles.updateOne(
      { nom: "manager" },
      { $set: { permissions: MANAGER_PERMISSIONS, description: "Responsable d'équipe — gère ses propres utilisateurs" } }
    );
    const userRole = await Roles.updateOne(
      { nom: "utilisateur" },
      { $set: { permissions: USER_PERMISSIONS, description: "Utilisateur standard" } }
    );
    fastify.log.info("Admin role permissions synchronized.");

    if (!adminRole || !userRole) {
      fastify.log.error("Default roles could not be created.");
      return;
    }

    // 2. Ensure a default admin user exists
    const adminEmail    = process.env.ADMIN_EMAIL    || "admin@habitflow.com";
    const existingAdmin = await Users.findOne({ email: adminEmail });

    if (!existingAdmin) {
      fastify.log.info("Creating default admin user...");
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin123!", 10);
      await Users.insertOne({
        lastName:     process.env.ADMIN_NOM    || "Admin",
        firstName:    process.env.ADMIN_PRENOM || "System",
        email:        adminEmail,
        passwordHash: hashed,
        role_id:      adminRole._id,
        department:   "IT",
        isActive:     true,
      });
      fastify.log.info(`Admin created: ${adminEmail}`);
    } else {
      // Repair role if needed (migration guard)
      const existingRole = existingAdmin.role_id
        ? await Roles.findById(existingAdmin.role_id)
        : null;

      if (!existingRole || existingRole.nom !== "admin") {
        await Users.updateOne({ _id: existingAdmin._id }, { $set: { role_id: adminRole._id } });
        fastify.log.info("Admin user role repaired.");
      }
      fastify.log.info(`Admin ready: ${existingAdmin.email}`);
    }
    // 3. Ensure the system-archived user exists (owns reassigned shared habits after anonymization)
    const systemUser = await Users.findById(SYSTEM_ARCHIVED_USER_ID);
    if (!systemUser) {
      await Users.insertOne({
        _id:           SYSTEM_ARCHIVED_USER_ID,
        lastName:     "[System]",
        firstName:    "Archived",
        email:        "system-archived@habitflow.internal",
        passwordHash: null,
        role_id:       userRole._id,
        department:   "",
        isActive:      false,
        anonymized:    true,
        is_system:     true,
      });
      fastify.log.info(`System archived user created: ${SYSTEM_ARCHIVED_USER_ID}`);
    }
  } catch (err) {
    fastify.log.error("setupAdmin error: " + (err.message || err));
    console.error("setupAdmin full error:", err);
  }
}
