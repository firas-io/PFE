import { AdminStats } from "../models/AdminStats.model.js";
import { Users }      from "@/modules/users/models/User.model.js";
import { Habits }     from "@/modules/habits/models/Habit.model.js";
import { HabitLogs }  from "@/modules/habit-logs/models/HabitLog.model.js";
import logger         from "@/utils/logger.util.js";

function _dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function _weekMonday(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

// Returns { periodStart, periodEnd, periodKey } for a given period descriptor.
function _resolvePeriod(period = "week", dateFrom, dateTo) {
  const now   = new Date(); now.setHours(0, 0, 0, 0);

  if (period === "custom" && dateFrom && dateTo) {
    const start = new Date(dateFrom); start.setHours(0, 0, 0, 0);
    const end   = new Date(dateTo);   end.setHours(23, 59, 59, 999);
    return { periodStart: start, periodEnd: end, periodKey: _dayKey(start), period: "custom" };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { periodStart: start, periodEnd: end, periodKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, period: "month" };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { periodStart: start, periodEnd: end, periodKey: String(now.getFullYear()), period: "year" };
  }

  // Default: previous week (Mon-Sun)
  const monday     = _weekMonday(now);
  const lastMonday = new Date(monday); lastMonday.setDate(monday.getDate() - 7);
  const lastSunday = new Date(lastMonday); lastSunday.setDate(lastMonday.getDate() + 6); lastSunday.setHours(23, 59, 59, 999);
  return { periodStart: lastMonday, periodEnd: lastSunday, periodKey: _dayKey(lastMonday), period: "week" };
}

class AdminStatsService {
  static async generate({ period = "week", dateFrom, dateTo } = {}) {
    const { periodStart, periodEnd, periodKey, period: resolvedPeriod } = _resolvePeriod(period, dateFrom, dateTo);

    const existing = await AdminStats.findOne({ period: resolvedPeriod, week_start: periodKey });
    if (existing) return existing;

    const [activeUsers, newHabits, weekLogs] = await Promise.all([
      Users.count({ isActive: true }),
      Habits.count({ createdAt: { $gte: periodStart, $lte: periodEnd } }),
      HabitLogs.find({ date: { $gte: periodStart, $lte: periodEnd } }, { projection: { statut: 1, habit_id: 1 } }),
    ]);

    const totalLogs     = weekLogs.length;
    const completedLogs = weekLogs.filter(l => l.statut === "completee").length;
    const avgCompletion = totalLogs ? Math.round((completedLogs / totalLogs) * 100) : 0;

    const weekHabits = await Habits.find(
      { createdAt: { $gte: periodStart, $lte: periodEnd } },
      { projection: { categorie: 1 } }
    );
    const catCount = {};
    for (const h of weekHabits) {
      const cat = h.categorie || "autre";
      catCount[cat] = (catCount[cat] || 0) + 1;
    }
    const topCategories = Object.entries(catCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stat = await AdminStats.insertOne({
      period:       resolvedPeriod,
      week_start:   periodKey,
      period_start: periodStart,
      period_end:   periodEnd,
      stats: {
        activeUsers,
        totalHabitsCreated: newHabits,
        avgCompletionRate:  avgCompletion,
        topCategories,
        totalLogsRecorded:  totalLogs,
      },
      generated_at: new Date(),
    });

    logger.info({ action: "admin-stats-generate", period: resolvedPeriod, periodKey }, "Admin stats generated");
    return stat;
  }

  static async getLast12Weeks({ period, dateFrom, dateTo } = {}) {
    const resolvedPeriod = period || "week";
    const existing = await AdminStats.find({ period: resolvedPeriod }, { sort: { week_start: -1 }, limit: 1 });
    if (!existing || existing.length === 0) {
      try { await AdminStatsService.generate({ period: resolvedPeriod, dateFrom, dateTo }); } catch (_) { /* ignore if no data yet */ }
    }
    return AdminStats.find({ period: resolvedPeriod }, { sort: { week_start: -1 }, limit: 12 });
  }
}

export default AdminStatsService;
