const Role = require("../models/Role");

async function routes(fastify) {

    // GET /roles — RÉSERVÉ AUX ADMINS
    fastify.get("/roles", {
        preHandler: [fastify.authenticate, fastify.authorize(["ROLES_VIEW"])]
    }, async (req, reply) => {
        try {
            const roles = await Role.find();
            return roles;
        } catch (err) {
            reply.code(500);
            return { error: err.message };
        }
    });

    // POST /roles — RÉSERVÉ AUX ADMINS
    fastify.post("/roles", {
        preHandler: [fastify.authenticate, fastify.authorize(["ROLES_MANAGE"])]
    }, async (req, reply) => {
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
    });

    // PUT /roles/:id — RÉSERVÉ AUX ADMINS
    fastify.put("/roles/:id", {
        preHandler: [fastify.authenticate, fastify.authorize(["ROLES_MANAGE"])]
    }, async (req, reply) => {
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
    });

    // DELETE /roles/:id — RÉSERVÉ AUX ADMINS (Empêcher de supprimer 'admin')
    fastify.delete("/roles/:id", {
        preHandler: [fastify.authenticate, fastify.authorize(["ROLES_MANAGE"])]
    }, async (req, reply) => {
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
    });
}

module.exports = routes;
