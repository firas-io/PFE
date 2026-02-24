const User = require("../models/User");

async function routes(fastify) {

  fastify.post("/users", async (req, reply) => {
    try {
      const user = await User.create(req.body);
      reply.code(201);
      return user;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.get("/users", async (req, reply) => {
    try {
      const users = await User.find();
      return users;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.get("/users/:id", async (req, reply) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        reply.code(404);
        return { error: "User not found" };
      }
      return user;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  fastify.put("/users/:id", async (req, reply) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!user) {
        reply.code(404);
        return { error: "User not found" };
      }
      return user;
    } catch(err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  fastify.delete("/users/:id", async (req, reply) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        reply.code(404);
        return { error: "User not found" };
      }
      reply.code(204);
      return null;
    } catch(err) {
      reply.code(500);
      return { error: err.message };
    }
  });

}

module.exports = routes;
