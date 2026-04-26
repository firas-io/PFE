import { Habits }       from "@/modules/habits/models/Habit.model.js";
import { HabitLogs }    from "@/modules/habit-logs/models/HabitLog.model.js";
import StreaksService   from "@/modules/streaks/streaks.service.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _startOfDay(date) { const d = new Date(date); d.setHours(0, 0, 0, 0);          return d; }
function _endOfDay(date)   { const d = new Date(date); d.setHours(23, 59, 59, 999);      return d; }

function _dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear().toString().padStart(4, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function _isHabitScheduledForDate(habit, targetDate) {
  if (!habit) return false;
  const datesSpecifiques = Array.isArray(habit.dates_specifiques) ? habit.dates_specifiques : [];
  if (datesSpecifiques.length > 0) {
    const targetKey = _dayKey(targetDate);
    return datesSpecifiques.some(d => _dayKey(new Date(d)) === targetKey);
  }
  return true;
}

async function _fetchHabitsAndLogs(userId, logsFilter) {
  const habits = await Habits.find(
    { $or: [{ user_id: userId }, { visible_pour_tous: true }] },
    { projection: { nom: 1, statut: 1, visible_pour_tous: 1, user_id: 1 } }
  );

  const ownedHabits  = habits.filter(h => h.user_id === userId);
  const sharedHabits = habits.filter(h => h.user_id !== userId);
  const ownedIds     = ownedHabits.map(h => h._id);
  const sharedIds    = sharedHabits.map(h => h._id);

  const ownedLogs = ownedIds.length
    ? await HabitLogs.find(
        { habit_id: { $in: ownedIds }, $or: [{ user_id: userId }, { user_id: { $exists: false } }, { user_id: null }], ...logsFilter },
        { projection: { habit_id: 1, date: 1, statut: 1 } }
      )
    : [];

  const sharedLogs = sharedIds.length
    ? await HabitLogs.find(
        { habit_id: { $in: sharedIds }, user_id: userId, ...logsFilter },
        { projection: { habit_id: 1, date: 1, statut: 1 } }
      )
    : [];

  return { habits, logs: [...ownedLogs, ...sharedLogs] };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getMyProgress(userId) {
  const { habits, logs } = await _fetchHabitsAndLogs(userId, {});

  const totalHabits    = habits.length;
  const activeHabits   = habits.filter(h => (h.statut || "active") === "active").length;
  const pausedHabits   = habits.filter(h => h.statut === "pause").length;
  const archivedHabits = habits.filter(h => h.statut === "archived").length;

  const totalLogs      = logs.length;
  const completedLogs  = logs.filter(l => l.statut === "completee").length;
  const partialLogs    = logs.filter(l => l.statut === "partielle").length;
  const completionRate = totalLogs ? Number(((completedLogs / totalLogs) * 100).toFixed(1)) : 0;

  const todayStart    = _startOfDay(new Date());
  const todayEnd      = _endOfDay(new Date());
  const todayLogs     = logs.filter(l => l.date >= todayStart && l.date <= todayEnd);
  const todayCompleted = todayLogs.filter(l => l.statut === "completee").length;
  const todayRate     = todayLogs.length ? Number(((todayCompleted / todayLogs.length) * 100).toFixed(1)) : 0;

  const weekStart = _startOfDay(new Date());
  weekStart.setDate(weekStart.getDate() - 6);
  const weekEnd  = _endOfDay(new Date());
  const weekLogs = logs.filter(l => l.date >= weekStart && l.date <= weekEnd);
  const perDay   = new Map();

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    perDay.set(_dayKey(d), { date: d, total: 0, completed: 0 });
  }
  for (const log of weekLogs) {
    const slot = perDay.get(_dayKey(log.date));
    if (!slot) continue;
    slot.total += 1;
    if (log.statut === "completee") slot.completed += 1;
  }
  const weeklyProgress = Array.from(perDay.values()).map(d => ({
    date:      d.date.toISOString(),
    label:     d.date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }),
    total:     d.total,
    completed: d.completed,
    rate:      d.total ? Number(((d.completed / d.total) * 100).toFixed(1)) : 0
  }));

  const logsByHabit = new Map();
  for (const log of logs) {
    const data = logsByHabit.get(log.habit_id) || { total: 0, completed: 0, lastLogDate: null };
    data.total += 1;
    if (log.statut === "completee") data.completed += 1;
    if (!data.lastLogDate || log.date > data.lastLogDate) data.lastLogDate = log.date;
    logsByHabit.set(log.habit_id, data);
  }
  const habitIds   = habits.map(h => h._id);
  const streakMap  = await StreaksService.getStreaksBatch(habitIds, userId);

  const habitsProgress = habits
    .map(h => {
      const s = logsByHabit.get(h._id) || { total: 0, completed: 0, lastLogDate: null };
      const streak = streakMap[h._id] || { currentStreak: 0, bestStreak: 0, lastCompletedDate: null };
      return {
        habit_id: h._id, habit_nom: h.nom, statut: h.statut || "active",
        visible_pour_tous: h.visible_pour_tous === true,
        total_logs: s.total, completed_logs: s.completed,
        completion_rate: s.total ? Number(((s.completed / s.total) * 100).toFixed(1)) : 0,
        last_log_date: s.lastLogDate,
        current_streak: streak.currentStreak,
        best_streak:    streak.bestStreak,
        last_completed_date: streak.lastCompletedDate,
      };
    })
    .sort((a, b) => b.completion_rate - a.completion_rate);

  return {
    summary: {
      total_habits: totalHabits, active_habits: activeHabits,
      paused_habits: pausedHabits, archived_habits: archivedHabits,
      total_logs: totalLogs, completed_logs: completedLogs, partial_logs: partialLogs,
      completion_rate: completionRate, today_logs: todayLogs.length,
      today_completed: todayCompleted, today_rate: todayRate
    },
    weekly_progress: weeklyProgress,
    habits_progress: habitsProgress
  };
}

export async function getToday(userId) {
  const habits = await Habits.find(
    { $or: [{ user_id: userId }, { visible_pour_tous: true }] },
    { projection: { _id: 1, nom: 1, statut: 1, visible_pour_tous: 1, user_id: 1 } }
  );

  const ownedHabits  = habits.filter(h => h.user_id === userId);
  const sharedHabits = habits.filter(h => h.user_id !== userId);
  const ownedIds     = ownedHabits.map(h => h._id);
  const sharedIds    = sharedHabits.map(h => h._id);
  const todayStart   = _startOfDay(new Date());
  const todayEnd     = _endOfDay(new Date());

  const ownedLogs = ownedIds.length
    ? await HabitLogs.find(
        { habit_id: { $in: ownedIds }, date: { $gte: todayStart, $lte: todayEnd }, $or: [{ user_id: userId }, { user_id: { $exists: false } }, { user_id: null }] },
        { projection: { habit_id: 1, date: 1, statut: 1, notes: 1 } }
      )
    : [];

  const sharedLogs = sharedIds.length
    ? await HabitLogs.find(
        { habit_id: { $in: sharedIds }, date: { $gte: todayStart, $lte: todayEnd }, user_id: userId },
        { projection: { habit_id: 1, date: 1, statut: 1, notes: 1 } }
      )
    : [];

  const logs = [...ownedLogs, ...sharedLogs];

  return {
    habits: habits.map(h => ({
      _id: h._id, nom: h.nom, statut: h.statut || "active",
      visible_pour_tous: h.visible_pour_tous === true,
      user_id: h.user_id
    })),
    logs: logs.map(l => ({ _id: l._id, habit_id: l.habit_id, date: l.date, statut: l.statut, notes: l.notes }))
  };
}

export async function getCalendar(userId, dateParam) {
  const requestedDate = dateParam ? new Date(dateParam) : new Date();
  if (Number.isNaN(requestedDate.getTime())) {
    const { createError } = await import("@/core/errors.js");
    throw createError(400, "Date invalide");
  }

  const monthStart     = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), 1);
  const monthEnd       = new Date(requestedDate.getFullYear(), requestedDate.getMonth() + 1, 0, 23, 59, 59, 999);
  const selectedDayKey = _dayKey(requestedDate);
  const todayStart     = _startOfDay(new Date());

  const habits       = await Habits.find({ $or: [{ user_id: userId }, { visible_pour_tous: true }] });
  const ownedHabits  = habits.filter(h => h.user_id === userId);
  const sharedHabits = habits.filter(h => h.user_id !== userId);
  const ownedIds     = ownedHabits.map(h => h._id);
  const sharedIds    = sharedHabits.map(h => h._id);

  const logs = await HabitLogs.find(
    {
      habit_id: { $in: [...ownedIds, ...sharedIds] },
      date: { $gte: monthStart, $lte: monthEnd },
      $or: [{ user_id: userId }, { user_id: { $exists: false } }, { user_id: null }]
    },
    { projection: { habit_id: 1, date: 1, statut: 1, notes: 1 } }
  );

  const processedLogs = logs.map(log => {
    const logDate = _startOfDay(log.date);
    if (logDate < todayStart && log.statut === "non_completee") return { ...log, statut: "manquee" };
    return log;
  });

  const daysMap = new Map();
  for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    const key = _dayKey(d);
    daysMap.set(key, { date: key, completed: false, total: 0, completed_logs: 0 });
  }
  processedLogs.forEach(log => {
    const entry = daysMap.get(_dayKey(log.date));
    if (!entry) return;
    entry.total += 1;
    if (log.statut === "completee") { entry.completed_logs += 1; entry.completed = true; }
  });

  const selectedDayLogs    = processedLogs.filter(log => _dayKey(log.date) === selectedDayKey);
  const selectedDayLogsMap = new Map();
  selectedDayLogs.forEach(log => selectedDayLogsMap.set(log.habit_id, log));

  const habitsForSelectedDay = habits.filter(h => _isHabitScheduledForDate(h, requestedDate));
  const selectedHabits = habitsForSelectedDay.map(h => ({
    _id: h._id, nom: h.nom, statut: h.statut || "active",
    visible_pour_tous: h.visible_pour_tous === true,
    user_id: h.user_id,
    frequence: h.frequence, jours_specifiques: h.jours_specifiques,
    log: selectedDayLogsMap.get(h._id) || null
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
}
