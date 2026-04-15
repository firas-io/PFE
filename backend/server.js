require("dotenv").config();
const fastify = require("fastify")({ logger: true });

// ─── CORS ─────────────────────────────────────────────────────────────────────
fastify.register(require("@fastify/cors"), {
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// ─── JSON Parser ──────────────────────────────────────────────────────────────
// Tolère les requêtes JSON avec corps vide (ex: POST sans payload explicite).
// Sans ce parser, Fastify renvoie FST_ERR_CTP_EMPTY_JSON_BODY quand
// "Content-Type: application/json" est envoyé avec un body vide.
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

// ─── Plugins ──────────────────────────────────────────────────────────────────
fastify.register(require("./src/config/db"));
fastify.register(require("./src/middlewares/auth.middleware"));

// ─── Startup Tasks ────────────────────────────────────────────────────────────
const setupAdmin = require("./src/utils/setupAdmin");
const setupHabitTemplates = require("./src/utils/setupHabitTemplates");
fastify.after(async () => {
  await setupAdmin(fastify);
  await setupHabitTemplates(fastify);
});

// ─── Root Route ───────────────────────────────────────────────────────────────
fastify.get("/", async (req, reply) => {
  return {
    message: "Welcome to HabitFlow API",
    version: "1.0.0",
    endpoints: {
      auth: "/login | /register | /login/ldap | /profile",
      users: "/users",
      roles: "/roles",
      habits: "/habits",
      habitTemplates: "/habits/templates",
      habitLogs: "/logs",
      habitStats: "/stats",
      progress: "/progress/my | /progress/today | /progress/calendar",
      reminders: "/reminders",
      sessions: "/sessions",
      onboarding: "/onboarding"
    }
  };
});

// ─── Routes ───────────────────────────────────────────────────────────────────
fastify.register(require("./src/routes/auth.routes"));
fastify.register(require("./src/routes/user.routes"));
fastify.register(require("./src/routes/role.routes"));
fastify.register(require("./src/routes/habit.routes"));
fastify.register(require("./src/routes/habitTemplate.routes"));
fastify.register(require("./src/routes/habitLog.routes"));
fastify.register(require("./src/routes/habitStats.routes"));
fastify.register(require("./src/routes/progress.routes"));
fastify.register(require("./src/routes/reminder.routes"));
fastify.register(require("./src/routes/session.routes"));
fastify.register(require("./src/routes/onboarding.routes"));

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 5000;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
