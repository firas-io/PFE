import { Reminders }  from "../models/Reminder.model.js";
import { createError } from "@/core/errors.js";

const _handle = fn => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || 500).send({ code: err.code, message: err.message }); }
};

export const createReminder = _handle(async (req, reply) => {
  reply.code(201).send(await Reminders.insertOne({ ...req.body, user_id: req.user.id }));
});

export const getReminders = _handle(async (req, reply) => {
  const isAdmin = req.user.permissions.includes("ALL") || req.user.permissions.includes("REMINDERS_MANAGE");
  const filter  = isAdmin ? {} : { user_id: req.user.id };
  reply.send(await Reminders.find(filter));
});

export const getReminderById = _handle(async (req, reply) => {
  const reminder = await Reminders.findById(req.params.id);
  if (!reminder) throw createError(404, "Reminder not found");

  const isAdmin = req.user.permissions.includes("REMINDERS_VIEW") || req.user.permissions.includes("ALL");
  if (reminder.user_id !== req.user.id && !isAdmin) throw createError(403, "Accès refusé");

  reply.send(reminder);
});

export const deleteReminder = _handle(async (req, reply) => {
  const reminder = await Reminders.findById(req.params.id);
  if (!reminder) throw createError(404, "Reminder not found");

  const isAdmin = req.user.permissions.includes("REMINDERS_MANAGE") || req.user.permissions.includes("ALL");
  if (reminder.user_id !== req.user.id && !isAdmin) throw createError(403, "Accès refusé");

  await Reminders.deleteOne({ _id: req.params.id });
  reply.code(204).send(null);
});
