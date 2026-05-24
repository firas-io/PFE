const CATEGORY_LABELS = {
  sport: "Sport",
  sante: "Santé",
  santé: "Santé",
  apprentissage: "Apprentissage",
  travail: "Travail",
  bien_etre: "Bien-être",
  "bien-etre": "Bien-être",
  autre: "Autre",
};

const DONUT_COLORS = ["#4338CA", "#EC4899", "#0EA5E9", "#059669", "#7C3AED", "#D97706"];

function _startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function _endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function _dayKey(date) {
  return _startOfDay(date).toISOString().slice(0, 10);
}

export function categoryLabel(slug) {
  return CATEGORY_LABELS[slug] || slug || "Autre";
}

export function computeCompletionAverage(dailyProgress) {
  if (!dailyProgress?.length) return 0;
  const sum = dailyProgress.reduce((s, d) => s + (d.rate || 0), 0);
  return Math.round(sum / dailyProgress.length);
}

export function computeCategoriesDistribution(habits) {
  const catCount = {};
  for (const h of habits) {
    const cat = h.categorie || "autre";
    catCount[cat] = (catCount[cat] || 0) + 1;
  }
  const total = habits.length;
  return Object.entries(catCount)
    .map(([category, count], i) => ({
      category,
      label:    categoryLabel(category),
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
      color:    DONUT_COLORS[i % DONUT_COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeTopHabitsByCategory(habits, logs, limit = 10) {
  const completedByHabit = {};
  for (const log of logs) {
    if (log.statut !== "completee") continue;
    completedByHabit[log.habit_id] = (completedByHabit[log.habit_id] || 0) + 1;
  }

  const rows = habits
    .map(h => ({
      habit_id:  h._id,
      nom:       h.nom,
      category:  h.categorie || "autre",
      label:     categoryLabel(h.categorie || "autre"),
      value:     completedByHabit[h._id] || 0,
    }))
    .filter(h => h.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  return rows;
}

function _countCalendarDays(periodStart, periodEnd) {
  const start = _startOfDay(periodStart);
  const end   = _startOfDay(periodEnd);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function _habitActiveOnDay(habit, day) {
  const statut = (habit.statut || "active").toLowerCase();
  if (statut === "archived") return false;
  if (habit.date_debut) {
    const debut = _startOfDay(new Date(habit.date_debut));
    if (day < debut) return false;
  }
  return statut === "active" || statut === "pause";
}

export function computeHabitCompletionRates(habits, logs, periodStart, periodEnd) {
  const totalDays = _countCalendarDays(periodStart, periodEnd);
  const activeHabits = habits.filter(h => (h.statut || "active") === "active");

  const rates = activeHabits.map(habit => {
    const habitStart = habit.date_debut
      ? _startOfDay(new Date(habit.date_debut))
      : _startOfDay(periodStart);
    const rangeStart = habitStart > periodStart ? habitStart : _startOfDay(periodStart);

    let eligibleDays = 0;
    let completedDays = 0;
    const cursor = new Date(rangeStart);

    while (cursor <= periodEnd) {
      const day = _startOfDay(cursor);
      if (_habitActiveOnDay(habit, day)) {
        eligibleDays++;
        const dayEnd = _endOfDay(day);
        const hasComplete = logs.some(
          l => l.habit_id === habit._id
            && l.statut === "completee"
            && l.date >= day
            && l.date <= dayEnd
        );
        if (hasComplete) completedDays++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const effectiveTotal = eligibleDays || totalDays;
    const rate = effectiveTotal
      ? Math.round((completedDays / effectiveTotal) * 100)
      : 0;

    return {
      habit_id:       habit._id,
      nom:            habit.nom,
      rate,
      completed_days: completedDays,
      total_days:     effectiveTotal,
    };
  });

  return rates
    .filter(h => h.total_days > 0)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 15);
}

function _longestCompleteStreakInPeriod(logs, periodStart, periodEnd) {
  const completeDays = new Set(
    logs
      .filter(l => l.statut === "completee")
      .map(l => _dayKey(l.date))
  );
  if (!completeDays.size) return 0;

  let best = 0;
  let current = 0;
  const cursor = new Date(_startOfDay(periodStart));
  const end = _startOfDay(periodEnd);

  while (cursor <= end) {
    const key = _dayKey(cursor);
    if (completeDays.has(key)) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return best;
}

export function _userDisplayName(user) {
  return (`${user.firstName || user.prenom || ""} ${user.lastName || user.nom || ""}`).trim() || user.email;
}

export function computeUserProductivity(users, habits, logs, periodStart, periodEnd) {
  const totalDays = _countCalendarDays(periodStart, periodEnd);

  return users
    .map(user => {
      const userHabitIds = new Set(habits.filter(h => h.user_id === user._id).map(h => h._id));
      const userLogs = logs.filter(l => userHabitIds.has(l.habit_id) || l.user_id === user._id);

      const completed = userLogs.filter(l => l.statut === "completee").length;
      const completionRate = userLogs.length
        ? Math.round((completed / userLogs.length) * 100)
        : 0;

      const daysWithLog = new Set(userLogs.map(l => _dayKey(l.date))).size;
      const regularity = totalDays ? daysWithLog / totalDays : 0;

      const bestStreak = _longestCompleteStreakInPeriod(userLogs, periodStart, periodEnd);
      const streakNorm = totalDays ? Math.min(bestStreak / totalDays, 1) : 0;

      const completionPart = (completionRate / 100) * 50;
      const regularityPart = regularity * 25;
      const streakPart     = streakNorm * 25;
      const score          = Math.round(completionPart + regularityPart + streakPart);

      return {
        user_id:         user._id,
        name:            _userDisplayName(user),
        score,
        completion_rate: completionRate,
        best_streak:     bestStreak,
        regularity:      Math.round(regularity * 100),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

export function enrichChartPayload(base, { habits, logs, periodStart, periodEnd, dailyProgress, users = null }) {
  const categories_distribution = computeCategoriesDistribution(habits);
  const top_habits_by_category  = computeTopHabitsByCategory(habits, logs);
  const completion_average      = computeCompletionAverage(dailyProgress);

  const payload = {
    ...base,
    completion_average,
    categories_distribution,
    top_habits_by_category,
  };

  if (users) {
    payload.habit_completion_rates = computeHabitCompletionRates(habits, logs, periodStart, periodEnd);
    payload.user_productivity      = computeUserProductivity(users, habits, logs, periodStart, periodEnd);
  }

  return payload;
}
