/**
 * user.controller.js
 * Business logic for user management (CRUD, role assignment, status toggle).
 * Extracted from UserRoutes.js
 */
const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");
const { addUser } = require("../config/ldap");

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateDefaultUserRole() {
  let role = await Role.findOne({ nom: "utilisateur" });
  if (!role) {
    role = await Role.create({
      nom: "utilisateur",
      description: "Rôle utilisateur par défaut",
      permissions: ["SELF_VIEW", "SELF_EDIT"]
    });
  }
  return role;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// POST /users — Public registration (role "utilisateur" auto-assigned)
exports.createUser = async (req, reply) => {
  try {
    const { mot_de_passe, role, nom, prenom, email, ...data } = req.body;
    if (!mot_de_passe) {
      reply.code(400);
      return { error: "mot_de_passe is required" };
    }

    // Force default role for public registrations
    const userRoleDoc = await getOrCreateDefaultUserRole();

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const user = await User.create({
      ...data,
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      role: userRoleDoc._id
    });

    // If LDAP is enabled, also add to LDAP
    if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true") {
      try {
        await addUser({ username: email, password: mot_de_passe, firstName: prenom, lastName: nom, email });
      } catch (ldapError) {
        console.error("Failed to add user to LDAP:", ldapError);
        // Continue anyway - user is created in MongoDB
      }
    }

    reply.code(201);
    return user;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// GET /users — Admin only (Permission: USERS_VIEW)
exports.getUsers = async (req, reply) => {
  try {
    const users = await User.find().populate("role").select("-mot_de_passe");
    return users;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /users/:id — Owner or Admin (Permission: USERS_VIEW)
exports.getUserById = async (req, reply) => {
  try {
    if (req.user.id !== req.params.id && !req.user.permissions.includes("USERS_VIEW") && !req.user.permissions.includes("ALL")) {
      reply.code(403);
      return { error: "Accès refusé" };
    }
    const user = await User.findById(req.params.id).populate("role").select("-mot_de_passe");
    if (!user) {
      reply.code(404);
      return { error: "User not found" };
    }
    return user;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// PATCH /users/:id/role — Admin only (Permission: USERS_MANAGE)
exports.updateUserRole = async (req, reply) => {
  try {
    const { roleNom } = req.body;
    const roleDoc = await Role.findOne({ nom: roleNom });

    if (!roleDoc) {
      reply.code(400);
      return { error: "Rôle inexistant" };
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: roleDoc._id },
      { new: true }
    ).populate("role").select("-mot_de_passe");

    if (!user) {
      reply.code(404);
      return { error: "User not found" };
    }

    return { message: "Rôle mis à jour", user };
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// DELETE /users/:id — Owner or Admin (USERS_MANAGE)
exports.deleteUser = async (req, reply) => {
  try {
    const isAdmin = req.user.permissions.includes("USERS_MANAGE") || req.user.permissions.includes("ALL");
    if (req.user.id !== req.params.id && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    if (req.user.id === req.params.id && req.user.role === "admin") {
      reply.code(400);
      return { error: "Un administrateur ne peut pas supprimer son propre compte." };
    }

    await User.findByIdAndDelete(req.params.id);
    reply.code(204);
    return null;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// POST /users/admin — Admin creates user (Permission: USERS_MANAGE)
exports.adminCreateUser = async (req, reply) => {
  try {
    const { nom, prenom, email, mot_de_passe, roleNom, departement } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe || !roleNom) {
      reply.code(400);
      return { error: "nom, prenom, email, mot_de_passe, and roleNom are required" };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      reply.code(400);
      return { error: "Email already in use" };
    }

    const roleDoc = await Role.findOne({ nom: roleNom });
    if (!roleDoc) {
      reply.code(400);
      return { error: "Invalid role" };
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const user = await User.create({
      nom, prenom, email,
      mot_de_passe: hashedPassword,
      role: roleDoc._id,
      departement: departement || "",
      isActive: true
    });

    if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true") {
      try {
        await addUser({ username: email, password: mot_de_passe, firstName: prenom, lastName: nom, email });
      } catch (ldapError) {
        console.error("Failed to add user to LDAP:", ldapError);
      }
    }

    const createdUser = await user.populate("role");
    reply.code(201);
    return createdUser;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// Shared handler for PATCH/PUT /users/:id
exports.updateUser = async (req, reply) => {
  try {
    req.server?.log?.info?.("updateUser called", {
      actorUserId: req.user && req.user.id,
      actorPermissions: req.user && req.user.permissions,
      targetUserId: req.params && req.params.id,
      body: req.body
    });
    const isAdmin = req.user.permissions.includes("USERS_MANAGE") || req.user.permissions.includes("ALL");
    const isOwner = req.user.id === req.params.id;
    if (!isOwner && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const { nom, prenom, email, departement } = req.body;

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        reply.code(400);
        return { error: "Email already in use" };
      }
    }

    const updateData = {};
    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (email !== undefined) updateData.email = email;
    if (departement !== undefined) updateData.departement = departement;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("role").select("-mot_de_passe");

    if (!user) {
      reply.code(404);
      return { error: "User not found" };
    }

    return user;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// PATCH /users/:id/status — Admin only (Permission: USERS_MANAGE)
exports.updateUserStatus = async (req, reply) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      reply.code(400);
      return { error: "isActive must be a boolean" };
    }

    const user = await User.findById(req.params.id).populate("role");
    if (!user) {
      reply.code(404);
      return { error: "User not found" };
    }

    if (req.user.id === req.params.id && !isActive) {
      reply.code(400);
      return { error: "Un administrateur ne peut pas désactiver son propre compte" };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).populate("role").select("-mot_de_passe");

    return { message: isActive ? "User activated" : "User deactivated", user: updatedUser };
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};
