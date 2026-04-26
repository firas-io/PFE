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

class AdminStatsService {
  static async generate() {
    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const monday     = _weekMonday(today);
    const lastMonday = new Date(monday); lastMonday.setDate(monday.getDate() - 7);
    const lastSunday = new Date(lastMonday); lastSunday.setDate(lastMonday.getDate() + 6); lastSunday.setHours(23, 59, 59, 999);
    const weekStartKey = _dayKey(lastMonday);

    const existing = await AdminStats.findOne({ week_start: weekStartKey });
    if (existing) return existing;

    const [activeUsers, newHabits, weekLogs] = await Promise.all([
      Users.count({ isActive: true }),
      Habits.count({ createdAt: { $gte: lastMonday, $lte: lastSunday } }),
      HabitLogs.find({ date: { $gte: lastMonday, $lte: lastSunday } }, { projection: { statut: 1, habit_id: 1 } }),
    ]);

    const totalLogs     = weekLogs.length;
    const completedLogs = weekLogs.filter(l => l.statut === "completee").length;
    const avgCompletion = totalLogs ? Math.round((completedLogs / totalLogs) * 100) : 0;

    // Top categories from habits created that week
    const weekHabits = await Habits.find(
      { createdAt: { $gte: lastMonday, $lte: lastSunday } },
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
      period:       "week",
      week_start:   weekStartKey,
      stats: {
        activeUsers,
        totalHabitsCreated: newHabits,
        avgCompletionRate:  avgCompletion,
        topCategories,
        totalLogsRecorded:  totalLogs,
      },
      generated_at: new Date(),
    });

    logger.info({ action: "admin-stats-cron", week_start: weekStartKey }, "Admin stats generated");
    return stat;
  }

  static async getLast12Weeks() {
    return AdminStats.find({ period: "week" }, { sort: { week_start: -1 }, limit: 12 });
  }
}

export default AdminStatsService;
