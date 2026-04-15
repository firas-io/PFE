/**
 * reminder.controller.js
 * Business logic for reminder management.
 * Extracted from ReminderRoutes.js
 */
const Reminder = require("../models/Reminder");

// POST /reminders — Authenticated (owner)
exports.createReminder = async (req, reply) => {
  try {
    const reminderData = { ...req.body, utilisateur_id: req.user.id };
    const reminder = await Reminder.create(reminderData);
    reply.code(201);
    return reminder;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// GET /reminders — Admin only (Permission: REMINDERS_VIEW)
exports.getReminders = async (req, reply) => {
  try {
    const reminders = await Reminder.find().populate("habit_id").populate("utilisateur_id");
    return reminders;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /reminders/:id — Owner or Admin
exports.getReminderById = async (req, reply) => {
  try {
    const reminder = await Reminder.findById(req.params.id).populate("utilisateur_id");
    if (!reminder) {
      reply.code(404);
      return { error: "Reminder not found" };
    }

    const isAdmin = req.user.permissions.includes("REMINDERS_VIEW") || req.user.permissions.includes("ALL");
    if (reminder.utilisateur_id._id.toString() !== req.user.id && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    return reminder;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// DELETE /reminders/:id — Owner or Admin
exports.deleteReminder = async (req, reply) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      reply.code(404);
      return { error: "Reminder not found" };
    }

    const isAdmin = req.user.permissions.includes("REMINDERS_MANAGE") || req.user.permissions.includes("ALL");
    if (reminder.utilisateur_id.toString() !== req.user.id && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    await Reminder.findByIdAndDelete(req.params.id);
    reply.code(204);
    return null;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};
