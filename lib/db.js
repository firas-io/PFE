const mongoose = require("mongoose");

module.exports = async function dbConnector(fastify, opts) {
  await mongoose.connect("mongodb://127.0.0.1/habitflow");
  fastify.log.info("MongoDB connected");
};
