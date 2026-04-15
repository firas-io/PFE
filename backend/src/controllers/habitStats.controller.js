/**
 * habitStats.controller.js
 * Business logic for habit statistics.
 * Extracted from routes/HabitStats.js
 */
const HabitStats = require("../models/HabitStats");

// POST /stats — Admin (Permission: STATS_MANAGE)
exports.createStats = async (req, reply) => {
  try {
    const stats = await HabitStats.create(req.body);
    reply.code(201);
    return stats;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// GET /stats — Admin only (Permission: STATS_VIEW)
exports.getAllStats = async (req, reply) => {
  try {
    const allStats = await HabitStats.find().populate("habit_id");
    return allStats;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /stats/:id — Owner or Admin
exports.getStatsById = async (req, reply) => {
  try {
    const stats = await HabitStats.findById(req.params.id).populate({
      path: "habit_id",
      populate: { path: "utilisateur_id" }
    });
    if (!stats) {
      reply.code(404);
      return { error: "Stats not found" };
    }

    const isAdmin = req.user.permissions.includes("STATS_VIEW") || req.user.permissions.includes("ALL");
    const habit = stats.habit_id;
    const ownerId = habit.utilisateur_id._id.toString();
    const shared = habit.visible_pour_tous === true;
    if (ownerId !== req.user.id && !isAdmin && !shared) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    return stats;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /stats/habit/:habitId — Owner or Admin
exports.getStatsByHabit = async (req, reply) => {
  try {
    const stats = await HabitStats.findOne({ habit_id: req.params.habitId }).populate({
      path: "habit_id",
      populate: { path: "utilisateur_id" }
    });
    if (!stats) {
      reply.code(404);
      return { error: "Stats not found" };
    }

    const isAdmin = req.user.permissions.includes("STATS_VIEW") || req.user.permissions.includes("ALL");
    const habit = stats.habit_id;
    const ownerId = habit.utilisateur_id._id.toString();
    const shared = habit.visible_pour_tous === true;
    if (ownerId !== req.user.id && !isAdmin && !shared) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    return stats;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};
