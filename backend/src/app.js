import Fastify    from "fastify";
import cors       from "@fastify/cors";
import rateLimit  from "@fastify/rate-limit";
import { setupAdmin }          from "@/fixtures/setup-admin.js";
import { setupHabitTemplates } from "@/fixtures/setup-habit-templates.js";
import { setupIndexes }        from "@/fixtures/setup-indexes.js";
import { migrateUsersEnglishFields } from "@/fixtures/migrate-users-english-fields.js";
import { migrateUserIdsToUuid }          from "@/fixtures/migrate-user-ids-to-uuid.js";
import { migrateLegacyEntityIdsToUuid } from "@/fixtures/migrate-legacy-entity-ids-to-uuid.js";
import dbPlugin   from "@/plugins/db.plugin.js";
import authPlugin from "@/plugins/auth.plugin.js";
import authRoutes          from "@/modules/auth/index.js";
import usersRoutes         from "@/modules/users/index.js";
import rolesRoutes         from "@/modules/roles/index.js";
import managersRoutes      from "@/modules/managers/index.js";
import offDaysRoutes       from "@/modules/off-days/index.js";
import categoryTicketsRoutes from "@/modules/category-tickets/index.js";
import weeklyRecapRoutes   from "@/modules/weekly-recap/index.js";
import adminStatsRoutes    from "@/modules/admin-stats/index.js";
import habitsRoutes        from "@/modules/habits/index.js";
import habitTemplatesRoutes from "@/modules/habit-templates/index.js";
import habitLogsRoutes     from "@/modules/habit-logs/index.js";
import habitStatsRoutes    from "@/modules/habit-stats/index.js";
import progressRoutes      from "@/modules/progress/index.js";
import remindersRoutes     from "@/modules/reminders/index.js";
import sessionsRoutes      from "@/modules/sessions/index.js";
import onboardingRoutes    from "@/modules/onboarding/index.js";
import categoriesRoutes    from "@/modules/categories/index.js";

export async function buildApp() {
  const fastify = Fastify({ logger: true });

  // ─── Global Schemas ─────────────────────────────────────────────────────────
  fastify.addSchema({
    $id: "errorResponse",
    type: "object",
    properties: {
      code:    { type: "string" },
      message: { type: "string" }
    }
  });

  // ─── CORS ───────────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // ─── JSON Parser ────────────────────────────────────────────────────────────
  fastify.removeContentTypeParser("application/json");
  fastify.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    try {
      const raw = typeof body === "string" ? body.trim() : "";
      if (!raw) return done(null, {});
      return done(null, JSON.parse(raw));
    } catch (err) {
      return done(err);
    }
  });

  // ─── Global Error Handler ───────────────────────────────────────────────────
  fastify.setErrorHandler((err, _req, reply) => {
    if (reply.sent) return;
    const statusCode = err.statusCode || err.status || 500;
    reply.code(statusCode).send({
      code:    err.code    || `ERR-${statusCode}`,
      message: err.message || "Internal Server Error",
    });
  });

  fastify.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({ code: "ERR-404", message: "Route not found" });
  });

  // ─── Rate Limiting ──────────────────────────────────────────────────────────
  //
  // Global limit  : 100 req / 1 min per IP (all routes).
  // Per-route overrides defined via config.rateLimit on individual routes
  // (see auth.routes.js: /login 5/min, /login/ldap 5/min, /register 3/h, /refresh 10/min).
  //
  // ⚠ Storage     : in-process memory. Does NOT work across multiple workers
  //   or Docker replicas — migrate to Redis (@fastify/rate-limit + ioredis) if
  //   clustering is introduced.
  //
  // ⚠ Reverse-proxy: if nginx / Cloudflare is added in front, set
  //   `trustProxy: true` on the Fastify instance AND ensure keyGenerator
  //   reads X-Forwarded-For, otherwise all requests will share the proxy IP
  //   and the global limit will be hit by the first legitimate user.
  //
  // ⚠ Admin bypass : intentionally absent. A compromised admin token with no
  //   rate limit is a DoS vector. Admins are capped at 100/min like everyone
  //   else. High-throughput admin operations should use dedicated endpoints.
  //
  // Disabled entirely when NODE_ENV=test to avoid breaking automated tests.
  if (process.env.NODE_ENV !== "test") {
    await fastify.register(rateLimit, {
      global:       true,
      max:          100,
      timeWindow:   "1 minute",
      keyGenerator: (req) => req.ip,
      errorResponseBuilder: (_req, context) => {
        const retrySeconds = Math.ceil(context.ttl / 1000);
        return {
          code:    "ERR-429",
          message: `Too many requests — retry after ${retrySeconds} second${retrySeconds !== 1 ? "s" : ""}`,
        };
      },
    });
  }

  // ─── Plugins ────────────────────────────────────────────────────────────────
  await fastify.register(dbPlugin);
  await fastify.register(authPlugin);

  // ─── Startup Fixtures ───────────────────────────────────────────────────────
  fastify.after(async () => {
    await setupAdmin(fastify);
    await migrateUsersEnglishFields();
    await migrateUserIdsToUuid();
    await migrateLegacyEntityIdsToUuid();
    await setupHabitTemplates(fastify);
    await setupIndexes();
  });

  // ─── Root Route ─────────────────────────────────────────────────────────────
  fastify.get("/", async () => ({
    message: "Welcome to HabitFlow API",
    version: "1.0.0",
    endpoints: {
      auth:           "/auth/config | /login | /register | /login/ldap | /profile | /refresh | /logout | /logout-all",
      users:          "/users",
      roles:          "/roles",
      habits:         "/habits",
      categories:     "/categories",
      habitTemplates: "/habits/templates",
      habitLogs:      "/logs",
      habitStats:     "/stats",
      progress:       "/progress/my | /progress/today | /progress/calendar",
      reminders:      "/reminders",
      sessions:       "/sessions",
      onboarding:     "/onboarding"
    }
  }));

  // ─── Module Routes ──────────────────────────────────────────────────────────
  fastify.register(authRoutes);
  fastify.register(usersRoutes);
  fastify.register(rolesRoutes);
  fastify.register(managersRoutes);
  fastify.register(offDaysRoutes);
  fastify.register(categoryTicketsRoutes);
  fastify.register(weeklyRecapRoutes);
  fastify.register(adminStatsRoutes);
  fastify.register(habitsRoutes);
  fastify.register(categoriesRoutes);
  fastify.register(habitTemplatesRoutes);
  fastify.register(habitLogsRoutes);
  fastify.register(habitStatsRoutes);
  fastify.register(progressRoutes);
  fastify.register(remindersRoutes);
  fastify.register(sessionsRoutes);
  fastify.register(onboardingRoutes);

  return fastify;
}
