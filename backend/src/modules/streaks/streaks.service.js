import { HabitLogs }  from "@/modules/habit-logs/models/HabitLog.model.js";
import { Habits }     from "@/modules/habits/models/Habit.model.js";
import { HabitStats } from "@/modules/habit-stats/models/HabitStats.model.js";
import { AppError }   from "@/core/errors.js";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function _dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function _mondayKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return _dayKey(d);
}

// ─── Core calculation ─────────────────────────────────────────────────────────

function _compute(logs, frequence) {
  if (!logs || logs.length === 0)
    return { currentStreak: 0, bestStreak: 0, lastCompletedDate: null };

  const isWeekly = ["weekly", "monthly", "times_per_week", "specific_days"].includes(frequence);
  const getKey   = isWeekly ? (l) => _mondayKey(l.date) : (l) => _dayKey(l.date);
  const step     = isWeekly ? 7 : 1;

  const completedSet = new Set(logs.map(getKey));
  const sortedLogs   = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCompletedDate = sortedLogs[0]?.date || null;

  // ── Current streak ──────────────────────────────────────────────────────────
  // Rule: start from today if already completed, otherwise start from yesterday
  // (grace period until midnight — standard for habit-tracking apps).
  // Only return 0 if the previous period is also empty (real gap).
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const todayKey = isWeekly ? _mondayKey(today) : _dayKey(today);

  let startDate;
  if (completedSet.has(todayKey)) {
    startDate = new Date(today);
  } else {
    const prev = new Date(today);
    prev.setDate(prev.getDate() - step);
    const prevKey = isWeekly ? _mondayKey(prev) : _dayKey(prev);
    if (!completedSet.has(prevKey)) {
      const best = _bestStreak(completedSet, step);
      return { currentStreak: 0, bestStreak: best, lastCompletedDate };
    }
    startDate = prev;
  }

  // Count consecutive completed periods backward from startDate
  let currentStreak = 0;
  const cur = new Date(startDate);
  while (completedSet.has(isWeekly ? _mondayKey(cur) : _dayKey(cur))) {
    currentStreak++;
    cur.setDate(cur.getDate() - step);
  }

  const bestStreak = Math.max(currentStreak, _bestStreak(completedSet, step));
  return { currentStreak, bestStreak, lastCompletedDate };
}

function _bestStreak(completedSet, step) {
  if (completedSet.size === 0) return 0;
  const sorted = [...completedSet].sort();
  let best = 1, temp = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev  = new Date(sorted[i - 1]);
    const curr  = new Date(sorted[i]);
    const diffD = Math.round((curr - prev) / 86400000);
    if (diffD === step) { temp++; } else { temp = 1; }
    if (temp > best) best = temp;
  }
  return best;
}

// ─── Public API ───────────────────────────────────────────────────────────────

class StreaksService {
  static async getStreaks(habitId, userId, permissions) {
    const habit = await Habits.findById(habitId);
    if (!habit) throw new AppError("Habitude introuvable", 404, "STK-001");

    const isAdmin  = (permissions || []).includes("HABITS_VIEW") || (permissions || []).includes("ALL");
    const isOwner  = habit.user_id === userId;
    const isShared = habit.visible_pour_tous === true;
    if (!isOwner && !isAdmin && !isShared)
      throw new AppError("Accès refusé", 403, "STK-002");

    // ── Cache check ──────────────────────────────────────────────────────────
    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    const cached = await HabitStats.findOne({ habit_id: habitId, user_id: userId });

    if (cached?.lastCalculatedAt && new Date(cached.lastCalculatedAt) >= todayMidnight) {
      return {
        currentStreak:     cached.currentStreak    ?? 0,
        bestStreak:        cached.bestStreak        ?? 0,
        lastCompletedDate: cached.lastCompletedDate ?? null,
      };
    }

    // ── Recalculate ──────────────────────────────────────────────────────────
    const logs = await HabitLogs.find({
      habit_id:    habitId,
      statut:      "completee",
      $or: [{ user_id: userId }, { user_id: { $exists: false } }, { user_id: null }],
    });

    const result = _compute(logs, habit.frequence || "daily");

    const patch = { ...result, habit_id: habitId, user_id: userId, lastCalculatedAt: new Date() };
    if (cached) {
      await HabitStats.updateOne({ _id: cached._id }, { $set: patch });
    } else {
      await HabitStats.insertOne(patch);
    }

    return result;
  }

  /** Compute streaks for multiple habits (used by progress/my). */
  static async getStreaksBatch(habitIds, userId) {
    if (!habitIds || habitIds.length === 0) return {};

    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    const cachedList    = await HabitStats.find({ habit_id: { $in: habitIds }, user_id: userId });
    const cachedMap     = new Map(cachedList.map(c => [c.habit_id, c]));

    const staleIds = habitIds.filter(id => {
      const c = cachedMap.get(id);
      return !c?.lastCalculatedAt || new Date(c.lastCalculatedAt) < todayMidnight;
    });

    if (staleIds.length > 0) {
      const [habits, logs] = await Promise.all([
        Habits.find({ _id: { $in: staleIds } }),
        HabitLogs.find({
          habit_id: { $in: staleIds },
          statut:   "completee",
          $or: [{ user_id: userId }, { user_id: { $exists: false } }, { user_id: null }],
        }),
      ]);

      const logsByHabit = new Map();
      for (const log of logs) {
        if (!logsByHabit.has(log.habit_id)) logsByHabit.set(log.habit_id, []);
        logsByHabit.get(log.habit_id).push(log);
      }

      for (const habit of habits) {
        const habitLogs = logsByHabit.get(habit._id) || [];
        const result    = _compute(habitLogs, habit.frequence || "daily");
        const patch     = { ...result, habit_id: habit._id, user_id: userId, lastCalculatedAt: new Date() };
        const existing  = cachedMap.get(habit._id);

        if (existing) {
          await HabitStats.updateOne({ _id: existing._id }, { $set: patch });
        } else {
          await HabitStats.insertOne(patch);
        }
        cachedMap.set(habit._id, patch);
      }
    }

    const result = {};
    for (const id of habitIds) {
      const c = cachedMap.get(id);
      result[id] = {
        currentStreak:     c?.currentStreak    ?? 0,
        bestStreak:        c?.bestStreak        ?? 0,
        lastCompletedDate: c?.lastCompletedDate ?? null,
      };
    }
    return result;
  }
}

export default StreaksService;
