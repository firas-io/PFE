const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");
const { addUser } = require("../lib/ldap");

async function routes(fastify) {
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

  // POST /users — Inscription publique (Assignation automatique du rôle "utilisateur")
  fastify.post("/users", async (req, reply) => {
    try {
      const { mot_de_passe, role, nom, prenom, email, ...data } = req.body;
      if (!mot_de_passe) {
        reply.code(400);
        return { error: "mot_de_passe is required" };
      }

      // Par sécurité, on force le rôle par défaut "utilisateur" pour les inscriptions publiques
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
          await addUser({
            username: email,
            password: mot_de_passe,
            firstName: prenom,
            lastName: nom,
            email: email
          });
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
  });

  // GET /users — RÉSERVÉ AUX ADMINS (Permission: USERS_VIEW)
  fastify.get("/users", {
    preHandler: [fastify.authenticate, fastify.authorize(["USERS_VIEW"])]
  }, async (req, reply) => {
    try {
      const users = await User.find().populate("role").select("-mot_de_passe");
      return users;
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // GET /users/:id — Propriétaire ou Admin (Permission: USERS_VIEW)
  fastify.get("/users/:id", {
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
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
  });

  // PATCH /users/:id/role — RÉSERVÉ AUX ADMINS (Permission: USERS_MANAGE)
  fastify.patch("/users/:id/role", {
    preHandler: [fastify.authenticate, fastify.authorize(["USERS_MANAGE"])]
  }, async (req, reply) => {
    try {
      const { roleNom } = req.body; // ex: { "roleNom": "admin" }
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
  });

  // DELETE /users/:id — USERS_MANAGE ou Propriétaire
  fastify.delete("/users/:id", {
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
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
  });

  // POST /users/admin — Création d'utilisateur par admin (Permission: USERS_MANAGE)
  fastify.post("/users/admin", {
    preHandler: [fastify.authenticate, fastify.authorize(["USERS_MANAGE"])]
  }, async (req, reply) => {
    try {
      const { nom, prenom, email, mot_de_passe, roleNom, departement } = req.body;

      // Validation
      if (!nom || !prenom || !email || !mot_de_passe || !roleNom) {
        reply.code(400);
        return { error: "nom, prenom, email, mot_de_passe, and roleNom are required" };
      }

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        reply.code(400);
        return { error: "Email already in use" };
      }

      // Récupérer le rôle
      const roleDoc = await Role.findOne({ nom: roleNom });
      if (!roleDoc) {
        reply.code(400);
        return { error: "Invalid role" };
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

      // Créer l'utilisateur
      const user = await User.create({
        nom,
        prenom,
        email,
        mot_de_passe: hashedPassword,
        role: roleDoc._id,
        departement: departement || "",
        isActive: true
      });

      // If LDAP is enabled, also add to LDAP
      if (String(process.env.LDAP_ENABLED || "false").toLowerCase() === "true") {
        try {
          await addUser({
            username: email,
            password: mot_de_passe,
            firstName: prenom,
            lastName: nom,
            email: email
          });
        } catch (ldapError) {
          console.error("Failed to add user to LDAP:", ldapError);
          // Continue anyway - user is created in MongoDB
        }
      }

      const createdUser = await user.populate("role");
      reply.code(201);
      return createdUser;
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // Handler partagé pour PATCH/PUT /users/:id
  const updateUser = async (req, reply) => {
    try {
      fastify.log.info("updateUser called", {
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

      // Vérifier que l'email n'existe pas ailleurs
      if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
        if (existingUser) {
          reply.code(400);
          return { error: "Email already in use" };
        }
      }

      // Mettre à jour seulement les champs autorisés
      const updateData = {};
      if (nom !== undefined) updateData.nom = nom;
      if (prenom !== undefined) updateData.prenom = prenom;
      if (email !== undefined) updateData.email = email;
      if (departement !== undefined) updateData.departement = departement;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate("role").select("-mot_de_passe");

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

  // PATCH /users/:id — Modification (propriétaire ou admin)
  fastify.patch("/users/:id", {
    preHandler: [fastify.authenticate]
  }, updateUser);

  // PUT /users/:id — Compatibilité frontend (même logique que PATCH)
  fastify.put("/users/:id", {
    preHandler: [fastify.authenticate]
  }, updateUser);

  // PATCH /users/:id/status — Désactiver/Réactiver un utilisateur (Permission: USERS_MANAGE)
  fastify.patch("/users/:id/status", {
    preHandler: [fastify.authenticate, fastify.authorize(["USERS_MANAGE"])]
  }, async (req, reply) => {
    try {
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        reply.code(400);
        return { error: "isActive must be a boolean" };
      }

      // Empêcher la désactivation du propre compte admin
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
  });
}

module.exports = routes;
