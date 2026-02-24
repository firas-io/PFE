const User = require("../models/User");

exports.createUser = async (req, reply) => {
  const user = await User.create(req.body);
  reply.send(user);
};

exports.getUsers = async (req, reply) => {
  const users = await User.find();
  reply.send(users);
};

exports.getUserById = async (req, reply) => {
  const user = await User.findById(req.params.id);
  reply.send(user);
};

exports.updateUser = async (req, reply) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  reply.send(user);
};

exports.deleteUser = async (req, reply) => {
  await User.findByIdAndDelete(req.params.id);
  reply.send({ message: "User deleted" });
};
