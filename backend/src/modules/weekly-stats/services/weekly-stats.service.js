import { Users }     from "@/modules/users/models/User.model.js";
import { Habits }    from "@/modules/habits/models/Habit.model.js";
import { HabitLogs } from "@/modules/habit-logs/models/HabitLog.model.js";

function _startOfDay(date) { const d = new Date(date); d.setHours(0, 0, 0, 0);     return d; }
function _endOfDay(date)   { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; }
function _dayKey(date)     { return _startOfDay(date).toISOString().slice(0, 10); }

function _weekBounds() {
  const now = new Date();
  const weekStart = _startOfDay(now);
  const day = weekStart.getDay(); // 0=Sunday, 1=Monday ... 6=Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

function _resolvePeriod(period = "week", dateFrom, dateTo) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (period === "custom" && dateFrom && dateTo) {
    return {
      periodStart: _startOfDay(new Date(dateFrom)),
      periodEnd:   _endOfDay(new Date(dateTo)),
      period:      "custom",
    };
  }
  if (period === "day") {
    return { periodStart: _startOfDay(now), periodEnd: _endOfDay(now), period: "day" };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { periodStart: _startOfDay(start), periodEnd: _endOfDay(end), period: "month" };
  }
  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end   = new Date(now.getFullYear(), 11, 31);
    return { periodStart: _startOfDay(start), periodEnd: _endOfDay(end), period: "year" };
  }
  if (dateFrom && dateTo) {
    return {
      periodStart: _startOfDay(new Date(dateFrom)),
      periodEnd:   _endOfDay(new Date(dateTo)),
      period:      period || "week",
    };
  }
  const { weekStart, weekEnd } = _weekBounds();
  return { periodStart: weekStart, periodEnd: weekEnd, period: "week" };
}

function _buildPeriodProgress(logs, periodStart, periodEnd, period) {
  if (period === "year") {
    const progress = [];
    const year = periodStart.getFullYear();
    for (let m = 0; m < 12; m++) {
      const start     = _startOfDay(new Date(year, m, 1));
      const end       = _endOfDay(new Date(year, m + 1, 0));
      const monthLogs = logs.filter(l => l.date >= start && l.date <= end);
      const complete  = monthLogs.filter(l => l.statut === "completee").length;
      progress.push({
        date:      start.toISOString(),
        label:     start.toLocaleDateString("fr-FR", { month: "short" }),
        total:     monthLogs.length,
        completed: complete,
        rate:      monthLogs.length ? Math.round((complete / monthLogs.length) * 100) : 0,
      });
    }
    return progress;
  }

  const progress = [];
  const cursor   = new Date(periodStart);
  const maxDays  = period === "month" ? 31 : 90;

  while (cursor <= periodEnd && progress.length < maxDays) {
    const dayStart = _startOfDay(cursor);
    const dayEnd   = _endOfDay(cursor);
    const dayLogs  = logs.filter(l => l.date >= dayStart && l.date <= dayEnd);
    const complete = dayLogs.filter(l => l.statut === "completee").length;
    progress.push({
      date:      dayStart.toISOString(),
      label:     dayStart.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }),
      total:     dayLogs.length,
      completed: complete,
      rate:      dayLogs.length ? Math.round((complete / dayLogs.length) * 100) : 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return progress;
}

function _dailyProgress(weekLogs, weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return _buildPeriodProgress(weekLogs, weekStart, weekEnd, "week");
}

function _weekDays(weekStart) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push({
      key:   _dayKey(day),
      date:  day.toISOString(),
      label: day.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }),
    });
  }
  return days;
}

class WeeklyStatsService {
  // ── Admin: platform-wide stats for selected period ───────────────────────────
  static async getAdminStats({ period, dateFrom, dateTo } = {}) {
    const { periodStart, periodEnd, period: resolvedPeriod } = _resolvePeriod(period, dateFrom, dateTo);

    const [totalUsers, periodLogs, allHabits] = await Promise.all([
      Users.count({ isActive: true, is_system: { $ne: true } }),
      HabitLogs.find(
        { date: { $gte: periodStart, $lte: periodEnd } },
        { projection: { user_id: 1, habit_id: 1, statut: 1, date: 1 } }
      ),
      Habits.find({}, { projection: { _id: 1, categorie: 1, createdAt: 1 } }),
    ]);

    const totalHabits        = allHabits.length;
    const newHabits          = allHabits.filter(h => h.createdAt >= periodStart && h.createdAt <= periodEnd).length;
    const completedLogs      = periodLogs.filter(l => l.statut === "completee").length;
    const completionRate     = periodLogs.length ? Math.round((completedLogs / periodLogs.length) * 100) : 0;
    const activeUserIds      = new Set(periodLogs.map(l => l.user_id));

    const catCount = {};
    for (const h of allHabits) {
      const cat = h.categorie || "autre";
      catCount[cat] = (catCount[cat] || 0) + 1;
    }
    const topCategories = Object.entries(catCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      period:                 resolvedPeriod,
      week_start:             periodStart.toISOString(),
      week_end:               periodEnd.toISOString(),
      total_users:            totalUsers,
      active_users_this_week: activeUserIds.size,
      total_habits:           totalHabits,
      new_habits_this_week:   newHabits,
      total_logs_this_week:   periodLogs.length,
      completed_this_week:    completedLogs,
      completion_rate:        completionRate,
      daily_progress:         _buildPeriodProgress(periodLogs, periodStart, periodEnd, resolvedPeriod),
      top_categories:         topCategories,
    };
  }

  // ── Manager: team stats for selected period ──────────────────────────────────
  static async getManagerStats(managerId, { period, dateFrom, dateTo } = {}) {
    const teamUsers = await Users.find({ manager_id: managerId, anonymized: { $ne: true } });
    const teamIds   = teamUsers.map(u => u._id);
    const { periodStart, periodEnd, period: resolvedPeriod } = _resolvePeriod(period, dateFrom, dateTo);

    if (teamIds.length === 0) {
      return {
        period: resolvedPeriod, team_size: 0, active_members: 0,
        total_habits: 0, total_logs_this_week: 0, completed_this_week: 0,
        completion_rate: 0, most_active_user: null,
        daily_progress: _buildPeriodProgress([], periodStart, periodEnd, resolvedPeriod),
        members_breakdown: [],
      };
    }

    const [teamHabits, weekLogs] = await Promise.all([
      Habits.find({ user_id: { $in: teamIds } }),
      HabitLogs.find(
        { user_id: { $in: teamIds }, date: { $gte: periodStart, $lte: periodEnd } },
        { projection: { user_id: 1, habit_id: 1, statut: 1, date: 1 } }
      ),
    ]);

    const completedLogs  = weekLogs.filter(l => l.statut === "completee").length;
    const completionRate = weekLogs.length ? Math.round((completedLogs / weekLogs.length) * 100) : 0;

    const userCompletions = {};
    for (const log of weekLogs) {
      if (log.statut === "completee") {
        userCompletions[log.user_id] = (userCompletions[log.user_id] || 0) + 1;
      }
    }
    let mostActiveUser = null;
    let maxCompleted   = -1;
    for (const [uid, count] of Object.entries(userCompletions)) {
      if (count > maxCompleted) {
        maxCompleted = count;
        const u = teamUsers.find(u => u._id === uid);
        if (u) {
          mostActiveUser = {
            _id:       uid,
            name:      (`${u.firstName || u.prenom || ""} ${u.lastName || u.nom || ""}`).trim() || u.email,
            completed: count,
          };
        }
      }
    }

    const membersBreakdown = teamUsers.map(user => {
      const userHabitIds  = new Set(teamHabits.filter(h => h.user_id === user._id).map(h => h._id));
      const userHabits    = teamHabits.filter(h => h.user_id === user._id);
      const userLogs      = weekLogs.filter(l => userHabitIds.has(l.habit_id));
      const userCompleted = userLogs.filter(l => l.statut === "completee").length;
      return {
        _id:                 user._id,
        name:                (`${user.firstName || user.prenom || ""} ${user.lastName || user.nom || ""}`).trim() || user.email,
        total_habits:        userHabits.length,
        total_logs:          userLogs.length,
        completed_this_week: userCompleted,
        completion_rate:     userLogs.length ? Math.round((userCompleted / userLogs.length) * 100) : 0,
        is_active:           user.isActive !== false,
      };
    }).sort((a, b) => b.completion_rate - a.completion_rate);

    return {
      period:                resolvedPeriod,
      week_start:            periodStart.toISOString(),
      week_end:              periodEnd.toISOString(),
      team_size:             teamUsers.length,
      active_members:        teamUsers.filter(u => u.isActive !== false).length,
      total_habits:          teamHabits.length,
      total_logs_this_week:  weekLogs.length,
      completed_this_week:   completedLogs,
      completion_rate:       completionRate,
      most_active_user:      mostActiveUser,
      daily_progress:        _buildPeriodProgress(weekLogs, periodStart, periodEnd, resolvedPeriod),
      members_breakdown:     membersBreakdown,
    };
  }

  // ── User: personal current week (Mon-Sun) ────────────────────────────────────
  static async getUserStats(userId) {
    const { weekStart, weekEnd } = _weekBounds();

    const habits   = await Habits.find({ user_id: userId });
    const habitIds = habits.map(h => h._id);

    const weekLogs = habitIds.length
      ? await HabitLogs.find(
          { habit_id: { $in: habitIds }, date: { $gte: weekStart, $lte: weekEnd } },
          { projection: { habit_id: 1, statut: 1, date: 1 } }
        )
      : [];

    const completedLogs  = weekLogs.filter(l => l.statut === "completee").length;
    const completionRate = weekLogs.length ? Math.round((completedLogs / weekLogs.length) * 100) : 0;

    const logsByHabit = {};
    for (const log of weekLogs) {
      if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = [];
      logsByHabit[log.habit_id].push(log);
    }

    const habitsStats = habits.map(h => {
      const hLogs      = logsByHabit[h._id] || [];
      const hCompleted = hLogs.filter(l => l.statut === "completee").length;
      return {
        _id:       h._id,
        nom:       h.nom,
        statut:    h.statut || "active",
        total:     hLogs.length,
        completed: hCompleted,
        rate:      hLogs.length ? Math.round((hCompleted / hLogs.length) * 100) : 0,
      };
    }).sort((a, b) => b.rate - a.rate);

    const weekDays = _weekDays(weekStart);
    const weeklyHabits = habits.map(h => {
      const hLogs = logsByHabit[h._id] || [];
      const days = weekDays.map(day => {
        const dayStart = new Date(day.date);
        const dayEnd = _endOfDay(dayStart);
        const logs = hLogs.filter(l => l.date >= dayStart && l.date <= dayEnd);
        const hasComplete = logs.some(l => l.statut === "completee");
        const hasNonComplete = logs.some(l => l.statut === "non_completee");
        const hasMissed = logs.some(l => l.statut === "manquee");
        return {
          key: day.key,
          date: day.date,
          label: day.label,
          status: hasComplete ? "completee" : hasNonComplete ? "non_completee" : hasMissed ? "manquee" : "none",
        };
      });

      const summary = habitsStats.find(s => s._id === h._id);
      return {
        _id: h._id,
        nom: h.nom,
        statut: h.statut || "active",
        rate: summary?.rate ?? 0,
        completed: summary?.completed ?? 0,
        total: summary?.total ?? 0,
        days,
      };
    }).sort((a, b) => b.rate - a.rate);

    return {
      period:               "current_week",
      week_start:           weekStart.toISOString(),
      week_end:             weekEnd.toISOString(),
      total_habits:         habits.length,
      active_habits:        habits.filter(h => (h.statut || "active") === "active").length,
      total_logs_this_week: weekLogs.length,
      completed_this_week:  completedLogs,
      completion_rate:      completionRate,
      week_days:            weekDays,
      daily_progress:       _dailyProgress(weekLogs, weekStart),
      habits_stats:         habitsStats,
      weekly_habits:        weeklyHabits,
    };
  }
}

export default WeeklyStatsService;
