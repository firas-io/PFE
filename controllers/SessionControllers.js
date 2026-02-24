const Session = require("../models/Session");

exports.createSession = async (req, reply) => {
  const session = await Session.create(req.body);
  reply.send(session);
};

exports.getSessions = async (req, reply) => {
  const sessions = await Session.find().populate("utilisateur_id");
  reply.send(sessions);
};

exports.deleteSession = async (req, reply) => {
  await Session.findByIdAndDelete(req.params.id);
  reply.send({ message: "Session deleted" });
};
