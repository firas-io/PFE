const HabitStats = require("../models/HabitStats");

exports.createStats = async (req, reply) => {
  const stats = await HabitStats.create(req.body);
  reply.send(stats);
};

exports.getStats = async (req, reply) => {
  const stats = await HabitStats.find().populate("habit_id");
  reply.send(stats);
};

exports.updateStats = async (req, reply) => {
  const stats = await HabitStats.findByIdAndUpdate(req.params.id, req.body, { new: true });
  reply.send(stats);
};

exports.deleteStats = async (req, reply) => {
  await HabitStats.findByIdAndDelete(req.params.id);
  reply.send({ message: "Stats deleted" });
};
