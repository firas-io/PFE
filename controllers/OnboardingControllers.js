const Onboarding = require("../models/Onboarding");

exports.createOnboarding = async (req, reply) => {
  const onboarding = await Onboarding.create(req.body);
  reply.send(onboarding);
};

exports.getOnboarding = async (req, reply) => {
  const onboarding = await Onboarding.find().populate("utilisateur_id");
  reply.send(onboarding);
};

exports.updateOnboarding = async (req, reply) => {
  const onboarding = await Onboarding.findByIdAndUpdate(req.params.id, req.body, { new: true });
  reply.send(onboarding);
};

exports.deleteOnboarding = async (req, reply) => {
  await Onboarding.findByIdAndDelete(req.params.id);
  reply.send({ message: "Onboarding deleted" });
};
