const HabitLog = require("../models/HabitLog");

exports.createLog = async (req, reply) => {
  const log = await HabitLog.create(req.body);
  reply.send(log);
};

exports.getLogs = async (req, reply) => {
  const logs = await HabitLog.find().populate("habit_id");
  reply.send(logs);
};

exports.updateLog = async (req, reply) => {
  const log = await HabitLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  reply.send(log);
};

exports.deleteLog = async (req, reply) => {
  await HabitLog.findByIdAndDelete(req.params.id);
  reply.send({ message: "Log deleted" });
};
