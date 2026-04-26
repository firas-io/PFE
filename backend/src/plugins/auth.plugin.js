import fp from "fastify-plugin";
import { Users } from "@/modules/users/models/User.model.js";
import { Roles } from "@/modules/roles/models/Role.model.js";

// ─── Ability → permission string mapping ─────────────────────────────────────
const ABILITY_MAP = {
  "read:Habit":           ["HABITS_VIEW"],
  "manage:Habit":         ["HABITS_MANAGE"],
  "read:HabitLog":        ["LOGS_VIEW"],
  "manage:HabitLog":      ["LOGS_MANAGE"],
  "read:HabitStats":      ["STATS_VIEW"],
  "manage:HabitStats":    ["STATS_MANAGE"],
  "read:User":            ["USERS_VIEW"],
  "manage:User":          ["USERS_MANAGE"],
  "read:Manager":         ["MANAGERS_MANAGE"],
  "manage:Manager":       ["MANAGERS_MANAGE"],
  "read:ManagerTeam":     ["MANAGER_TEAM_VIEW"],
  "read:ManagerUser":     ["MANAGER_USERS_VIEW"],
  "manage:ManagerUser":   ["MANAGER_USERS_MANAGE"],
  "read:Role":            ["ROLES_VIEW"],
  "manage:Role":          ["ROLES_MANAGE"],
  "read:Reminder":        ["REMINDERS_VIEW"],
  "manage:Reminder":      ["REMINDERS_MANAGE"],
  "read:Session":         ["SESSIONS_VIEW"],
  "manage:Session":       ["SESSIONS_MANAGE"],
  "read:Onboarding":      ["ONBOARDING_VIEW"],
  "manage:Onboarding":    ["ONBOARDING_MANAGE"],
  "manage:OffDay":        ["OFF_DAYS_MANAGE"],
  "read:OffDay":          ["OFFDAYS_VIEW"],
  "read:Stats":           ["STATS_VIEW"],
  "read:Log":             ["LOGS_VIEW"],
  "manage:Ticket":        ["TICKETS_MANAGE"],
  "read:AdminStats":      ["ADMIN_STATS_VIEW"],
};

async function jwtPlugin(fastify) {
  await fastify.register(
    (await import("@fastify/jwt")).default,
    {
      secret: process.env.JWT_SECRET || "supersecretkey_changez_moi",
      sign:   { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    }
  );

  // ─── verifyAccessToken ──────────────────────────────────────────────────────
  fastify.decorate("verifyAccessToken", async function (request, reply) {
    try {
      await request.jwtVerify();

      const userId = request.user?.id;
      if (!userId) return reply.code(401).send({ code: "AUTH-001", message: "Unauthorized" });

      const user = await Users.findById(userId);
      if (!user) return reply.code(401).send({ code: "AUTH-001", message: "Unauthorized" });
      if (!user.isActive) return reply.code(403).send({ code: "AUTH-002", message: "User deactivated" });

      const role = user.role_id ? await Roles.findById(user.role_id) : null;
      request.user.id          = user._id;
      request.user.email       = user.email;
      request.user.role        = role?.nom ?? null;
      request.user.permissions = role?.permissions ?? [];
    } catch {
      reply.code(401).send({ code: "AUTH-001", message: "Unauthorized" });
    }
  });

  // ─── verifyAbility ──────────────────────────────────────────────────────────
  fastify.decorate("verifyAbility", function (abilities) {
    return async function (request, reply) {
      if (reply.sent) return;
      const userPerms = request.user?.permissions || [];
      if (userPerms.includes("ALL")) return;

      for (const { action, subject } of abilities) {
        const required = ABILITY_MAP[`${action}:${subject}`] || [];
        const has = required.some(p => userPerms.includes(p));
        if (!has) {
          return reply.code(403).send({
            code: "AUTH-003",
            message: `Forbidden: requires ${action} on ${subject}`
          });
        }
      }
    };
  });

  // ─── auth (chains handlers in sequence) ────────────────────────────────────
  fastify.decorate("auth", function (handlers) {
    const self = this;
    return async function chainedAuth(request, reply) {
      for (const handler of handlers) {
        if (reply.sent) return;
        await handler.call(self, request, reply);
      }
    };
  });
                        
  // ─── Legacy aliases (backward compat) ──────────────────────────────────────
  fastify.decorate("authenticate", fastify.verifyAccessToken);
  fastify.decorate("authorize", function (requiredPermissions) {
    return async (request, reply) => {
      const userPerms = request.user?.permissions || [];
      if (userPerms.includes("ALL")) return;
      const has = requiredPermissions.some(p => userPerms.includes(p));
      if (!has) reply.code(403).send({ code: "AUTH-003", message: `Required: [${requiredPermissions.join(", ")}]` });
    };
  });
}

export default fp(jwtPlugin, { name: "auth" });
