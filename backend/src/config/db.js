const mongoose = require("mongoose");

module.exports = async function dbConnector(fastify) {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1/habitflow";
  try {
    await mongoose.connect(uri);
    fastify.log.info("MongoDB connected");
  } catch (error) {
    // Re-throw so Fastify aborts startup — a server without a DB is
    // non-functional and should not silently accept requests.
    fastify.log.error("MongoDB connection failed: " + error.message);
    throw error;
  }
};
