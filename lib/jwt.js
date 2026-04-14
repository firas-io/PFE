const fp = require("fastify-plugin");
const User = require("../models/User");

async function jwtPlugin(fastify) {
  await fastify.register(require("@fastify/jwt"), {
    secret: process.env.JWT_SECRET || "supersecretkey_changez_moi"
  });

  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();

      // Bloquer l'accès si l'utilisateur est désactivé
      const userId = request.user?.id;
      if (!userId) {
        reply.code(401).send({ error: "Unauthorized" });
        return;
      }

      // Recharger le user pour valider isActive + prendre en compte les rôles récents
      const user = await User.findById(userId).populate("role", "nom permissions");
      if (!user) {
        reply.code(401).send({ error: "Unauthorized" });
        return;
      }

      if (!user.isActive) {
        reply.code(403).send({ error: "User deactivated" });
        return;
      }

      // Met à jour les claims RBAC depuis Mongo
      request.user.id = user._id.toString();
      request.user.email = user.email;
      request.user.role = user.role?.nom;
      request.user.permissions = user.role?.permissions || [];
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }
  });

  /**
   * Décorateur Senior pour RBAC basé sur les permissions réelles (pas juste les noms de rôles)
   * @param {string[]} requiredPermissions - Liste des permissions permettant l'accès (OU logique)
   */
  fastify.decorate("authorize", function (requiredPermissions) {
    return async (request, reply) => {
      const userPermissions = request.user.permissions || [];

      // L'admin avec la permission "ALL" a accès à tout
      if (userPermissions.includes("ALL")) return;

      // Vérifier si l'utilisateur possède au moins une des permissions requises
      const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

      if (!hasPermission) {
        reply.code(403).send({
          error: "Forbidden",
          message: `Accès refusé. Permissions requises manquantes : [${requiredPermissions.join(", ")}]`
        });
        return;
      }
    };
  });
}

module.exports = fp(jwtPlugin);