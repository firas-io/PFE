const fastify = require("fastify")({ logger: true });

// Register database plugin
fastify.register(require("../lib/db"));

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
      reminders: "/reminders",
      sessions: "/sessions",
      onboarding: "/onboarding"
    }
  };
});

// Register all routes
fastify.register(require("../routes/UserRoutes"));
fastify.register(require("../routes/HabitRoutes"));
fastify.register(require("../routes/HabitLogRoutes"));
fastify.register(require("../routes/HabitStats"));
fastify.register(require("../routes/ReminderRoutes"));
fastify.register(require("../routes/SessionRoutes"));
fastify.register(require("../routes/onboardingRoutes"));

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on port 3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
