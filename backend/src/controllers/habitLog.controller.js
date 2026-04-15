/**
 * habitLog.controller.js
 * Business logic for habit log CRUD, catch-up logs, and incomplete-habit queries.
 * Extracted from HabitLogRoutes.js
 */
const HabitLog = require("../models/HabitLog");
const Habit = require("../models/Habit");

// ─── Permission Helpers ───────────────────────────────────────────────────────

function habitOwnerId(habit) {
  const u = habit.utilisateur_id;
  if (!u) return "";
  if (typeof u === "object" && u._id) return u._id.toString();
  return u.toString();
}

function canPostLogForHabit(req, habit) {
  const owner = habitOwnerId(habit) === req.user.id;
  const isAdmin = req.user.permissions.includes("LOGS_MANAGE") || req.user.permissions.includes("ALL");
  if (owner || isAdmin) return true;
  return habit.visible_pour_tous === true;
}

function canAccessLog(req, habit, log) {
  const isAdmin = req.user.permissions.includes("LOGS_VIEW") || req.user.permissions.includes("ALL");
  if (isAdmin) return true;
  const owner = habitOwnerId(habit) === req.user.id;
  if (owner) return true;
  if (habit.visible_pour_tous === true && log.utilisateur_id && log.utilisateur_id.toString() === req.user.id) {
    return true;
  }
  return false;
}

function canMutateLog(req, habit, log) {
  const isAdmin = req.user.permissions.includes("LOGS_MANAGE") || req.user.permissions.includes("ALL");
  if (isAdmin) return true;
  const owner = habitOwnerId(habit) === req.user.id;
  if (owner) return true;
  if (habit.visible_pour_tous === true && log.utilisateur_id && log.utilisateur_id.toString() === req.user.id) {
    return true;
  }
  return false;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// POST /logs — Owner, Admin, or shared habit
exports.createLog = async (req, reply) => {
  try {
    const habitId = req.body?.habit_id ?? req.body?.habitId;
    if (!habitId) {
      reply.code(400);
      return { error: "habit_id is required" };
    }

    const habit = await Habit.findById(habitId);
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    if (!canPostLogForHabit(req, habit)) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const { utilisateur_id: _ignore, utilisateurId: _i2, ...rest } = req.body;
    const log = await HabitLog.create({
      ...rest,
      habit_id: habitId,
      utilisateur_id: req.user.id
    });
    reply.code(201);
    return log;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// GET /logs — Admin only (Permission: LOGS_VIEW)
exports.getAllLogs = async (req, reply) => {
  try {
    const logs = await HabitLog.find().populate("habit_id");
    return logs;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /logs/:id — Owner or Admin
exports.getLogById = async (req, reply) => {
  try {
    const log = await HabitLog.findById(req.params.id).populate({
      path: "habit_id",
      populate: { path: "utilisateur_id" }
    });

    if (!log) {
      reply.code(404);
      return { error: "Log not found" };
    }

    if (!canAccessLog(req, log.habit_id, log)) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    return log;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// PUT /logs/:id — Owner or Admin
exports.updateLog = async (req, reply) => {
  try {
    const log = await HabitLog.findById(req.params.id).populate("habit_id");
    if (!log) {
      reply.code(404);
      return { error: "Log not found" };
    }

    if (!canMutateLog(req, log.habit_id, log)) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const { utilisateur_id: _u, utilisateurId: _u2, ...safeBody } = req.body ?? {};
    const updatedLog = await HabitLog.findByIdAndUpdate(req.params.id, safeBody, { new: true });
    return updatedLog;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// DELETE /logs/:id — Owner or Admin
exports.deleteLog = async (req, reply) => {
  try {
    const log = await HabitLog.findById(req.params.id).populate("habit_id");
    if (!log) {
      reply.code(404);
      return { error: "Log not found" };
    }

    if (!canMutateLog(req, log.habit_id, log)) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    await HabitLog.findByIdAndDelete(req.params.id);
    reply.code(204);
    return null;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /logs/incomplete-for-date/:date — Get missed habits for a specific date
exports.getIncompleteForDate = async (req, reply) => {
  try {
    const targetDate = new Date(req.params.date);
    if (Number.isNaN(targetDate.getTime())) {
      reply.code(400);
      return { error: "Date invalide" };
    }

    // Get all habits for this user
    const habits = await Habit.find({
      $or: [{ utilisateur_id: req.user.id }, { visible_pour_tous: true }]
    });

    const habitIds = habits.map(h => h._id);

    // Get logs for this date
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const logs = await HabitLog.find({
      habit_id: { $in: habitIds },
      date: { $gte: dayStart, $lte: dayEnd }
    }).populate("habit_id");

    // Find only missed habits (manquee status)
    const missedHabits = [];
    for (const habit of habits) {
      const log = logs.find(l => l.habit_id._id.toString() === habit._id.toString());

      // Only show habits with "manquee" status
      if (log && log.statut === "manquee") {
        missedHabits.push({
          habit_id: habit._id,
          nom: habit.nom,
          categorie: habit.categorie,
          frequence: habit.frequence,
          current_status: log.statut,
          has_photo: log?.photo_url ? true : false
        });
      }
    }

    return {
      date: targetDate.toISOString().split("T")[0],
      incomplete_habits: missedHabits
    };
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// POST /logs/catchup — Submit a catch-up log with photo verification
exports.catchupLog = async (req, reply) => {
  try {
    const { habit_id, date, photo_url, notes } = req.body;

    if (!habit_id || !date || !photo_url) {
      reply.code(400);
      return { error: "habit_id, date, and photo_url are required" };
    }

    if (typeof photo_url !== "string" || !photo_url.startsWith("data:image")) {
      reply.code(400);
      return { error: "photo_url must be a valid base64 image" };
    }

    const habit = await Habit.findById(habit_id);
    if (!habit) {
      reply.code(404);
      return { error: "Habitude non trouvée" };
    }

    const isOwner = habit.utilisateur_id.toString() === req.user.id;
    const isAdmin = req.user.permissions.includes("LOGS_MANAGE") || req.user.permissions.includes("ALL");
    if (!isOwner && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const targetDate = new Date(date);
    if (Number.isNaN(targetDate.getTime())) {
      reply.code(400);
      return { error: "Date invalide" };
    }

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    let log = await HabitLog.findOne({
      habit_id,
      date: { $gte: dayStart, $lte: dayEnd },
      utilisateur_id: req.user.id
    });

    if (log) {
      log.statut = "completee";
      log.photo_url = photo_url;
      log.notes = notes || log.notes;
      log.retroactif = true;
      await log.save();
    } else {
      log = await HabitLog.create({
        habit_id,
        utilisateur_id: req.user.id,
        date: targetDate,
        statut: "completee",
        photo_url,
        notes: notes || undefined,
        retroactif: true
      });
    }

    console.log("[CATCHUP] Habit caught up with photo:", {
      habit_id: habit._id,
      user_id: req.user.id,
      date: targetDate.toISOString().split("T")[0],
      has_photo: !!photo_url,
      has_notes: !!notes
    });

    reply.code(201);
    return log;
  } catch (err) {
    console.error("[CATCHUP] Error:", err.message);
    reply.code(400);
    return { error: err.message };
  }
};
