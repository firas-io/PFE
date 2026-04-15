/**
 * progress.controller.js
 * Business logic for user progress dashboard, today's habits, and calendar view.
 * Extracted from ProgressRoutes.js
 */
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear().toString().padStart(4, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

// Determine if a habit should be shown on a specific date based on its frequency
function isHabitScheduledForDate(habit, targetDate) {
  if (!habit) return false;

  const frequence = habit.frequence || "daily";
  const datesSpecifiques = Array.isArray(habit.dates_specifiques) ? habit.dates_specifiques : [];

  // If specific dates are set, check if the target date is in the list
  if (datesSpecifiques.length > 0) {
    const targetDateKey = dayKey(targetDate);
    const isInList = datesSpecifiques.some(d => dayKey(new Date(d)) === targetDateKey);
    console.log(`[SCHEDULE] Habit "${habit.nom}" (specific dates): ${targetDateKey} in list=${isInList}`);
    return isInList;
  }

  // If no specific dates, show all habits (daily frequency default)
  console.log(`[SCHEDULE] Habit "${habit.nom}" (no specific dates, frequence=${frequence}): SHOW`);
  return true;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// GET /progress/my — Full progress summary for current user
exports.getMyProgress = async (req, reply) => {
  try {
    const habits = await Habit.find({
      $or: [{ utilisateur_id: req.user.id }, { visible_pour_tous: true }]
    }).select("nom statut visible_pour_tous utilisateur_id");

    const ownedHabits = habits.filter((h) => h.utilisateur_id.toString() === req.user.id);
    const sharedHabits = habits.filter((h) => h.utilisateur_id.toString() !== req.user.id);

    const ownedIds = ownedHabits.map((h) => h._id);
    const sharedIds = sharedHabits.map((h) => h._id);

    const ownedLogs = ownedIds.length
      ? await HabitLog.find({
          habit_id: { $in: ownedIds },
          $or: [{ utilisateur_id: req.user.id }, { utilisateur_id: { $exists: false } }, { utilisateur_id: null }]
        }).select("habit_id date statut")
      : [];

    const sharedLogs = sharedIds.length
      ? await HabitLog.find({ habit_id: { $in: sharedIds }, utilisateur_id: req.user.id }).select("habit_id date statut")
      : [];

    const logs = [...ownedLogs, ...sharedLogs];

    const totalHabits = habits.length;
    const activeHabits = habits.filter((h) => (h.statut || "active") === "active").length;
    const pausedHabits = habits.filter((h) => h.statut === "pause").length;
    const archivedHabits = habits.filter((h) => h.statut === "archived").length;

    const totalLogs = logs.length;
    const completedLogs = logs.filter((l) => l.statut === "completee").length;
    const partialLogs = logs.filter((l) => l.statut === "partielle").length;
    const completionRate = totalLogs ? Number(((completedLogs / totalLogs) * 100).toFixed(1)) : 0;

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const todayLogs = logs.filter((l) => l.date >= todayStart && l.date <= todayEnd);
    const todayCompleted = todayLogs.filter((l) => l.statut === "completee").length;
    const todayRate = todayLogs.length ? Number(((todayCompleted / todayLogs.length) * 100).toFixed(1)) : 0;

    const weekStart = startOfDay(new Date());
    weekStart.setDate(weekStart.getDate() - 6);
    const weekEnd = endOfDay(new Date());
    const weekLogs = logs.filter((l) => l.date >= weekStart && l.date <= weekEnd);
    const perDay = new Map();

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      perDay.set(dayKey(d), { date: d, total: 0, completed: 0 });
    }

    for (const log of weekLogs) {
      const key = dayKey(log.date);
      const slot = perDay.get(key);
      if (!slot) continue;
      slot.total += 1;
      if (log.statut === "completee") slot.completed += 1;
    }

    const weeklyProgress = Array.from(perDay.values()).map((d) => ({
      date: d.date.toISOString(),
      label: d.date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }),
      total: d.total,
      completed: d.completed,
      rate: d.total ? Number(((d.completed / d.total) * 100).toFixed(1)) : 0
    }));

    const logsByHabit = new Map();
    for (const log of logs) {
      const key = log.habit_id.toString();
      const data = logsByHabit.get(key) || { total: 0, completed: 0, lastLogDate: null };
      data.total += 1;
      if (log.statut === "completee") data.completed += 1;
      if (!data.lastLogDate || log.date > data.lastLogDate) data.lastLogDate = log.date;
      logsByHabit.set(key, data);
    }

    const habitsProgress = habits
      .map((h) => {
        const stats = logsByHabit.get(h._id.toString()) || { total: 0, completed: 0, lastLogDate: null };
        const rate = stats.total ? Number(((stats.completed / stats.total) * 100).toFixed(1)) : 0;
        return {
          habit_id: h._id,
          habit_nom: h.nom,
          statut: h.statut || "active",
          visible_pour_tous: h.visible_pour_tous === true,
          total_logs: stats.total,
          completed_logs: stats.completed,
          completion_rate: rate,
          last_log_date: stats.lastLogDate
        };
      })
      .sort((a, b) => b.completion_rate - a.completion_rate);

    return {
      summary: {
        total_habits: totalHabits,
        active_habits: activeHabits,
        paused_habits: pausedHabits,
        archived_habits: archivedHabits,
        total_logs: totalLogs,
        completed_logs: completedLogs,
        partial_logs: partialLogs,
        completion_rate: completionRate,
        today_logs: todayLogs.length,
        today_completed: todayCompleted,
        today_rate: todayRate
      },
      weekly_progress: weeklyProgress,
      habits_progress: habitsProgress
    };
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /progress/today — Today's habits and their logs
exports.getToday = async (req, reply) => {
  try {
    const habits = await Habit.find({
      $or: [{ utilisateur_id: req.user.id }, { visible_pour_tous: true }]
    }).select("_id nom statut visible_pour_tous utilisateur_id");

    const ownedHabits = habits.filter((h) => h.utilisateur_id.toString() === req.user.id);
    const sharedHabits = habits.filter((h) => h.utilisateur_id.toString() !== req.user.id);

    const ownedIds = ownedHabits.map((h) => h._id);
    const sharedIds = sharedHabits.map((h) => h._id);

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const ownedLogs = ownedIds.length
      ? await HabitLog.find({
          habit_id: { $in: ownedIds },
          date: { $gte: todayStart, $lte: todayEnd },
          $or: [{ utilisateur_id: req.user.id }, { utilisateur_id: { $exists: false } }, { utilisateur_id: null }]
        }).select("habit_id date statut notes")
      : [];

    const sharedLogs = sharedIds.length
      ? await HabitLog.find({
          habit_id: { $in: sharedIds },
          date: { $gte: todayStart, $lte: todayEnd },
          utilisateur_id: req.user.id
        }).select("habit_id date statut notes")
      : [];

    const logs = [...ownedLogs, ...sharedLogs];

    return {
      habits: habits.map(h => ({
        _id: h._id,
        nom: h.nom,
        statut: h.statut || "active",
        visible_pour_tous: h.visible_pour_tous === true,
        utilisateur_id: h.utilisateur_id
      })),
      logs: logs.map(l => ({
        _id: l._id,
        habit_id: l.habit_id,
        date: l.date,
        statut: l.statut,
        notes: l.notes
      }))
    };
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /progress/calendar — Monthly calendar view with per-day completion stats
exports.getCalendar = async (req, reply) => {
  try {
    const dateParam = typeof req.query.date === "string" ? req.query.date : null;
    const requestedDate = dateParam ? new Date(dateParam) : new Date();
    if (Number.isNaN(requestedDate.getTime())) {
      reply.code(400);
      return { error: "Date invalide" };
    }

    const monthStart = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), 1);
    const monthEnd = new Date(requestedDate.getFullYear(), requestedDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const selectedDayKey = dayKey(requestedDate);
    const todayStart = startOfDay(new Date());

    // Fetch full habit details (frequency info needed for scheduling)
    const habits = await Habit.find({
      $or: [{ utilisateur_id: req.user.id }, { visible_pour_tous: true }]
    });

    const ownedHabits = habits.filter((h) => h.utilisateur_id.toString() === req.user.id);
    const sharedHabits = habits.filter((h) => h.utilisateur_id.toString() !== req.user.id);

    const ownedIds = ownedHabits.map((h) => h._id);
    const sharedIds = sharedHabits.map((h) => h._id);

    const logQuery = {
      habit_id: { $in: [...ownedIds, ...sharedIds] },
      date: { $gte: monthStart, $lte: monthEnd },
      $or: [{ utilisateur_id: req.user.id }, { utilisateur_id: { $exists: false } }, { utilisateur_id: null }]
    };

    const logs = await HabitLog.find(logQuery).select("habit_id date statut notes");

    // Mark past non-completed logs as "manquee"
    const processedLogs = logs.map((log) => {
      const logDate = startOfDay(log.date);
      if (logDate < todayStart && log.statut === "non_completee") {
        return { ...log.toObject(), statut: "manquee" };
      }
      return log;
    });

    const daysMap = new Map();
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const key = dayKey(d);
      daysMap.set(key, { date: key, completed: false, total: 0, completed_logs: 0 });
    }

    processedLogs.forEach((log) => {
      const key = dayKey(log.date);
      const entry = daysMap.get(key);
      if (!entry) return;
      entry.total += 1;
      if (log.statut === "completee") {
        entry.completed_logs += 1;
        entry.completed = true;
      }
    });

    const selectedDayLogs = processedLogs.filter((log) => dayKey(log.date) === selectedDayKey);
    const selectedDayLogsMap = new Map();
    selectedDayLogs.forEach((log) => selectedDayLogsMap.set(log.habit_id.toString(), log));

    // Filter habits for selected date based on frequency
    const habitsForSelectedDay = habits.filter((h) => isHabitScheduledForDate(h, requestedDate));

    const selectedHabits = habitsForSelectedDay.map((h) => ({
      _id: h._id,
      nom: h.nom,
      statut: h.statut || "active",
      visible_pour_tous: h.visible_pour_tous === true,
      utilisateur_id: h.utilisateur_id,
      frequence: h.frequence,
      jours_specifiques: h.jours_specifiques,
      log: selectedDayLogsMap.get(h._id.toString()) || null
    }));

    return {
      month: requestedDate.getMonth() + 1,
      year: requestedDate.getFullYear(),
      selectedDate: selectedDayKey,
      days: Array.from(daysMap.values()),
      habits: selectedHabits,
      allHabits: habitsForSelectedDay,
      allLogs: processedLogs
    };
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};
