/**
 * role.controller.js
 * Business logic for role management (CRUD).
 * Extracted from RoleRoutes.js
 */
const Role = require("../models/Role");

// GET /roles — Admin only (Permission: ROLES_VIEW)
exports.getRoles = async (req, reply) => {
  try {
    const roles = await Role.find();
    return roles;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// POST /roles — Admin only (Permission: ROLES_MANAGE)
exports.createRole = async (req, reply) => {
  try {
    const role = await Role.create(req.body);
    reply.code(201);
    return role;
  } catch (err) {
    if (err.code === 11000) {
      reply.code(400);
      return { error: "Ce rôle existe déjà" };
    }
    reply.code(400);
    return { error: err.message };
  }
};

// PUT /roles/:id — Admin only (Permission: ROLES_MANAGE)
exports.updateRole = async (req, reply) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!role) {
      reply.code(404);
      return { error: "Rôle non trouvé" };
    }
    return role;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// DELETE /roles/:id — Admin only (Permission: ROLES_MANAGE) — cannot delete "admin" role
exports.deleteRole = async (req, reply) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      reply.code(404);
      return { error: "Rôle non trouvé" };
    }

    if (role.nom === "admin") {
      reply.code(400);
      return { error: "Impossible de supprimer le rôle administrateur système." };
    }

    await Role.findByIdAndDelete(req.params.id);
    reply.code(204);
    return null;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};
