const mongoose = require("mongoose");

module.exports = async function dbConnector(fastify, opts) {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1/habitflow";
  try {
    await mongoose.connect(uri);
    fastify.log.info("MongoDB connected");
  } catch (error) {
    fastify.log.error("MongoDB connection failed:", error.message);
    fastify.log.warn("Server starting without database connection");
  }
};
