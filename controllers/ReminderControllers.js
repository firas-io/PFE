const Reminder = require("../models/Reminder");

exports.createReminder = async (req, reply) => {
  const reminder = await Reminder.create(req.body);
  reply.send(reminder);
};

exports.getReminders = async (req, reply) => {
  const reminders = await Reminder.find().populate("habit_id").populate("utilisateur_id");
  reply.send(reminders);
};

exports.updateReminder = async (req, reply) => {
  const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
  reply.send(reminder);
};

exports.deleteReminder = async (req, reply) => {
  await Reminder.findByIdAndDelete(req.params.id);
  reply.send({ message: "Reminder deleted" });
};
