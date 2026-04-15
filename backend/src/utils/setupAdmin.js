const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");

/**
 * Initialise les rôles et l'administrateur par défaut.
 */
async function setupAdmin(fastify) {
    try {
        // 1. Créer les rôles par défaut s'ils n'existent pas
        const defaultRoles = [
            { nom: "admin", description: "Accès total au système", permissions: ["ALL"] },
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

        for (const roleData of defaultRoles) {
            const existingRole = await Role.findOne({ nom: roleData.nom });
            if (!existingRole) {
                await Role.create(roleData);
                fastify.log.info(`Rôle créé : ${roleData.nom}`);
            }
            // Do NOT overwrite permissions of existing roles — an admin
            // may have customised them via the /roles API.
        }

        // 2. Récupérer l'ID du rôle admin
        const adminRole = await Role.findOne({ nom: "admin" });
        const userRole = await Role.findOne({ nom: "utilisateur" });

        if (!adminRole || !userRole) {
            fastify.log.error("Les rôles par défaut n'ont pas pu être créés. Vérifiez la base de données.");
            return;
        }

        // 3. Vérifier s'il y a un admin
        const adminEmail = process.env.ADMIN_EMAIL || "admin@habitflow.com";
        const existingAdmin = await User.findOne({ email: adminEmail }).populate("role");

        if (!existingAdmin) {
            fastify.log.info("Création de l'admin par défaut...");
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin123!", 10);

            await User.create({
                nom: process.env.ADMIN_NOM || "Admin",
                prenom: process.env.ADMIN_PRENOM || "System",
                email: adminEmail,
                mot_de_passe: hashedPassword,
                role: adminRole._id, // Utilisation de l'ID du rôle
                departement: "IT"
            });
            fastify.log.info(`Administrateur créé : ${adminEmail}`);
        } else {
            // S'assurer que l'existant a bien le bon rôle (migration si besoin)
            if (!existingAdmin.role || existingAdmin.role.nom !== "admin") {
                const adminToUpdate = await User.findById(existingAdmin._id);
                if (adminToUpdate) {
                    adminToUpdate.role = adminRole._id;
                    await adminToUpdate.save();
                    fastify.log.info("Rôle de l'admin existant mis à jour.");
                }
            }
            fastify.log.info(`Admin prêt : ${existingAdmin.email}`);
        }
    } catch (err) {
        fastify.log.error("Erreur setupAdmin :", err.message || err.toString());
        console.error("Full error:", err);
    }
}

module.exports = setupAdmin;
