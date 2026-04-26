import "dotenv/config";
import { buildApp } from "./src/app.js";

const fastify = await buildApp();

try {
  const port = Number(process.env.PORT) || 5000;
  await fastify.listen({ port, host: "0.0.0.0" });
  console.log(`Server running on port ${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
