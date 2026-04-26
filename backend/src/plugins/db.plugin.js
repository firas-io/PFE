import fp from "fastify-plugin";
import { MongoDBManager } from "@/core/mongo.connect.js";
import { validateEnv }    from "@/config/env.validator.js";

async function dbConnector(fastify) {
  const { MONGO_URI } = validateEnv();
  try {
    await MongoDBManager.connect(MONGO_URI);
    fastify.log.info("MongoDB connected");
  } catch (error) {
    fastify.log.error("MongoDB connection failed: " + error.message);
    throw error;
  }
}

export default fp(dbConnector, { name: "db" });
