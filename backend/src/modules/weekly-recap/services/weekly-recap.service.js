import { WeeklyRecaps } from "../models/WeeklyRecap.model.js";
import { Users }        from "@/modules/users/models/User.model.js";
import { Habits }       from "@/modules/habits/models/Habit.model.js";
import { HabitLogs }    from "@/modules/habit-logs/models/HabitLog.model.js";
import { AppError }     from "@/core/errors.js";
import logger           from "@/utils/logger.util.js";

function _dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function _startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function _endOfDay(d)   { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }

/** Returns the Monday of the ISO week containing `date`. */
function _weekMonday(date) {
  const d   = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

/** Compute week stats for a single user over [weekStart, weekEnd]. */
async function _computeWeekStats(userId, weekStart, weekEnd) {
  const habits = await Habits.find(
    { $or: [{ user_id: userId }, { visible_pour_tous: true }] },
    { projection: { _id: 1, nom: 1, statut: 1, frequence: 1, user_id: 1 } }
  );

  if (habits.length === 0)
    return { totalHabits: 0, completedCount: 0, completionRate: 0, bestHabit: null, worstHabit: null, streakHighlight: null };

  const habitIds  = habits.map(h => h._id);
  const ownedIds  = habits.filter(h => h.user_id === userId).map(h => h._id);
  const sharedIds = habits.filter(h => h.user_id !== userId).map(h => h._id);

  const [ownedLogs, sharedLogs] = await Promise.all([
    ownedIds.length
      ? HabitLogs.find({ habit_id: { $in: ownedIds }, date: { $gte: weekStart, $lte: weekEnd }, $or: [{ user_id: userId }, { user_id: { $exists: false } }] })
      : [],
    sharedIds.length
      ? HabitLogs.find({ habit_id: { $in: sharedIds }, date: { $gte: weekStart, $lte: weekEnd }, user_id: userId })
      : [],
  ]);
  const logs = [...ownedLogs, ...sharedLogs];

  const logsByHabit = new Map();
  for (const log of logs) {
    const d = logsByHabit.get(log.habit_id) || { total: 0, completed: 0 };
    d.total++;
    if (log.statut === "completee") d.completed++;
    logsByHabit.set(log.habit_id, d);
  }

  let completedCount = 0;
  let bestHabit      = null;
  let worstHabit     = null;
  let bestRate       = -1;
  let worstRate      = 101;
  let streakHigh     = null;
  let maxStreak      = 0;

  for (const habit of habits) {
    const s    = logsByHabit.get(habit._id) || { total: 0, completed: 0 };
    const rate = s.total ? Math.round((s.completed / s.total) * 100) : 0;

    if (s.completed > 0) completedCount++;

    if (rate > bestRate)  { bestRate  = rate;  bestHabit  = { habitId: habit._id, name: habit.nom, rate }; }
    if (rate < worstRate && s.total > 0) { worstRate = rate; worstHabit = { habitId: habit._id, name: habit.nom, rate }; }

    // Simple streak: consecutive completed days in the week
    const dayKeys   = new Set(logs.filter(l => l.habit_id === habit._id && l.statut === "completee").map(l => _dayKey(l.date)));
    let   streak    = 0;
    let   tempStreak = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(d.getDate() + i);
      if (dayKeys.has(_dayKey(d))) { tempStreak++; streak = Math.max(streak, tempStreak); } else { tempStreak = 0; }
    }
    if (streak > maxStreak) { maxStreak = streak; streakHigh = { habitId: habit._id, name: habit.nom, streak }; }
  }

  const completionRate = habits.length ? Math.round((completedCount / habits.length) * 100) : 0;

  return {
    totalHabits: habits.length,
    completedCount,
    completionRate,
    bestHabit,
    worstHabit:      worstHabit?.habitId === bestHabit?.habitId ? null : worstHabit,
    streakHighlight: streakHigh,
  };
}

class WeeklyRecapService {
  /** Called by cron — generates recaps for all active users for the past week. */
  static async generateForAllUsers() {
    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const monday    = _weekMonday(today);
    // Last week: go back 7 days from this Monday
    const lastMonday = new Date(monday); lastMonday.setDate(monday.getDate() - 7);
    const lastSunday = new Date(lastMonday); lastSunday.setDate(lastMonday.getDate() + 6); lastSunday.setHours(23, 59, 59, 999);

    const weekStartKey = _dayKey(lastMonday);

    const users = await Users.find({ isActive: true, is_system: { $ne: true } });
    let created = 0;

    for (const user of users) {
      const existing = await WeeklyRecaps.findOne({ user_id: user._id, week_start: weekStartKey });
      if (existing) continue;

      const stats = await _computeWeekStats(user._id, lastMonday, lastSunday);
      await WeeklyRecaps.insertOne({
        user_id:      user._id,
        week_start:   weekStartKey,
        week_end:     _dayKey(lastSunday),
        stats,
        generated_at: new Date(),
        viewed:       false,
      });
      created++;
    }

    logger.info({ action: "weekly-recap-cron", week_start: weekStartKey, created }, "Weekly recaps generated");
    return created;
  }

  /** GET /weekly-recap/latest — most recent unviewed recap for the user. */
  static async getLatest(userId) {
    const recap = await WeeklyRecaps.findOne({ user_id: userId, viewed: false }, { sort: { week_start: -1 } });
    return recap || null;
  }

  /** GET /weekly-recap — paginated list for the user. */
  static async list(userId, query) {
    const page  = Math.max(1, parseInt(query?.page)  || 1);
    const limit = Math.min(50, parseInt(query?.limit) || 10);
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      WeeklyRecaps.find({ user_id: userId }, { sort: { week_start: -1 }, skip, limit }),
      WeeklyRecaps.count({ user_id: userId }),
    ]);

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /** PATCH /weekly-recap/:id/viewed */
  static async markViewed(id, userId) {
    const recap = await WeeklyRecaps.findById(id);
    if (!recap) throw new AppError("Récap introuvable", 404, "WRC-001");
    if (recap.user_id !== userId) throw new AppError("Accès refusé", 403, "WRC-002");
    return WeeklyRecaps.updateOne({ _id: id }, { $set: { viewed: true } });
  }
}

export default WeeklyRecapService;
export { _computeWeekStats };
