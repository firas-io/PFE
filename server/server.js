require("dotenv").config();
const fastify = require("fastify")({ logger: true });

// Enable CORS
fastify.register(require("@fastify/cors"), {
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

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

// Register plugins
fastify.register(require("../lib/db"));
fastify.register(require("../lib/jwt"));

// Setup Default Admin
const setupAdmin = require("../lib/setupAdmin");
const setupHabitTemplates = require("../lib/setupHabitTemplates");
fastify.after(async () => {
  await setupAdmin(fastify);
  await setupHabitTemplates(fastify);
});

// Root route
fastify.get("/", async (req, reply) => {
  return {
    message: "Welcome to HabitFlow API",
    version: "1.0.0",
    endpoints: {
      users: "/users",
      habits: "/habits",
      habitLogs: "/logs",
      habitStats: "/stats",
      progress: "/progress/my",
      reminders: "/reminders",
      sessions: "/sessions",
      onboarding: "/onboarding"
    }
  };
});

// Register all routes
fastify.register(require("../routes/UserRoutes"));
fastify.register(require("../routes/RoleRoutes"));
fastify.register(require("../routes/HabitRoutes"));
fastify.register(require("../routes/HabitTemplateRoutes"));
fastify.register(require("../routes/HabitLogRoutes"));
fastify.register(require("../routes/HabitStats"));
fastify.register(require("../routes/ProgressRoutes"));
fastify.register(require("../routes/ReminderRoutes"));
fastify.register(require("../routes/SessionRoutes"));
fastify.register(require("../routes/onboardingRoutes"));
fastify.register(require("../routes/authentificationRoutes"));

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 5000, host: "0.0.0.0" });
    console.log("Server running on port 5000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
