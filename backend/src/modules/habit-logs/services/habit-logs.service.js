import { paginate }   from "@/helpers/pagination.helper.js";
import { HabitLogs }  from "../models/HabitLog.model.js";
import { Habits }     from "@/modules/habits/models/Habit.model.js";
import { Users }      from "@/modules/users/models/User.model.js";
import { AppError }   from "@/core/errors.js";
import logger         from "@/utils/logger.util.js";
import { ErrorsCodes, ErrorMessages } from "../constants/habit-logs.constants.js";

function _isSameUser(a, b) {
  return String(a ?? "") !== "" && String(a ?? "") === String(b ?? "");
}

function _isSharedHabit(habit) {
  const raw = habit?.visible_pour_tous;
  return raw === true || raw === "true" || raw === 1 || raw === "1";
}

function _canPostLog(userId, permissions, habit) {
  if (permissions.includes("LOGS_MANAGE") || permissions.includes("ALL")) return true;
  if (_isSameUser(habit.user_id, userId)) return true;
  if (_isSharedHabit(habit)) return true;
  return false;
}

function _canAccess(userId, permissions, habit, log) {
  if (permissions.includes("LOGS_VIEW") || permissions.includes("ALL")) return true;
  if (_isSameUser(habit.user_id, userId)) return true;
  if (_isSharedHabit(habit) && _isSameUser(log.user_id, userId)) return true;
  return false;
}

function _canMutate(userId, permissions, habit, log) {
  if (permissions.includes("LOGS_MANAGE") || permissions.includes("ALL")) return true;
  if (_isSameUser(habit.user_id, userId)) return true;
  if (_isSharedHabit(habit) && _isSameUser(log.user_id, userId)) return true;
  return false;
}

class HabitLogsService {
  static async toggleLogForDate(habitId, dateStr, userId, permissions) {
    if (!habitId) throw new AppError(ErrorMessages[ErrorsCodes.HABIT_ID_REQUIRED], 400, ErrorsCodes.HABIT_ID_REQUIRED);
    const targetDate = new Date(dateStr);
    if (Number.isNaN(targetDate.getTime())) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_DATE], 400, ErrorsCodes.INVALID_DATE);

    const habit = await Habits.findById(habitId);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.HABIT_NOT_FOUND], 404, ErrorsCodes.HABIT_NOT_FOUND);
    if (!_canPostLog(userId, permissions, habit)) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);
    const existing = await HabitLogs.findOne({
      habit_id: habitId,
      user_id: userId,
      date: { $gte: dayStart, $lte: dayEnd },
    });

    if (existing) {
      const nextStatus = existing.statut === "completee" ? "non_completee" : "completee";
      return HabitLogs.updateOne({ _id: existing._id }, { $set: { statut: nextStatus } });
    }

    return HabitLogs.insertOne({
      habit_id: habitId,
      user_id: userId,
      date: targetDate,
      statut: "completee",
    });
  }

  static async createLog(body, userId, permissions) {
    const habitId = body?.habit_id ?? body?.habitId;
    if (!habitId) throw new AppError(ErrorMessages[ErrorsCodes.HABIT_ID_REQUIRED], 400, ErrorsCodes.HABIT_ID_REQUIRED);

    const habit = await Habits.findById(habitId);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.HABIT_NOT_FOUND], 404, ErrorsCodes.HABIT_NOT_FOUND);
    if (!_canPostLog(userId, permissions, habit)) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const { utilisateur_id: _a, utilisateurId: _b, user_id: _c, ...rest } = body;
    logger.info({ action: "create-log", userId, habitId }, "Log created");
    return HabitLogs.insertOne({ ...rest, habit_id: habitId, user_id: userId });
  }

  static async getAllLogs(query = {}, currentUser = {}) {
    const page   = parseInt(query?.page)  || 1;
    const limit  = Math.min(parseInt(query?.limit) || 50, 200);
    const filter = {};

    // Manager : restreindre aux logs de son équipe uniquement
    // Admin (USERS_VIEW) : voir tous les logs
    const isAdmin = (currentUser.permissions || []).includes("USERS_VIEW") ||
                    (currentUser.permissions || []).includes("ALL");
    if (!isAdmin && currentUser.id) {
      const teamMembers = await Users.find({ manager_id: currentUser.id, anonymized: { $ne: true } });
      const teamIds = teamMembers.map(u => u._id);
      if (teamIds.length === 0) {
        return { data: [], pagination: { total: 0, pages: 0, currentPage: page, limit, hasNext: false, hasPrev: false } };
      }
      filter.user_id = { $in: teamIds };
    }

    // Filtre par statut
    if (query?.statut && query.statut !== "all") {
      filter.statut = query.statut;
    }

    // Filtre par plage de dates
    if (query?.dateDebut || query?.dateFin) {
      filter.date = {};
      if (query.dateDebut) filter.date.$gte = new Date(query.dateDebut);
      if (query.dateFin) {
        const end = new Date(query.dateFin);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Filtre par recherche (nom utilisateur ou habitude) — résolution via IDs
    if (query?.search?.trim()) {
      const term  = query.search.trim();
      const regex = new RegExp(term, "i");

      const [matchedUsers, matchedHabits] = await Promise.all([
        Users.find({ $or: [
          { firstName: { $regex: regex } }, { prenom: { $regex: regex } },
          { lastName:  { $regex: regex } }, { nom:    { $regex: regex } },
          { email:     { $regex: regex } },
        ]}),
        Habits.find({ nom: { $regex: regex } }),
      ]);

      const userIds  = matchedUsers.map(u => u._id);
      const habitIds = matchedHabits.map(h => h._id);

      if (userIds.length === 0 && habitIds.length === 0) {
        return { data: [], pagination: { total: 0, pages: 0, currentPage: page, limit, hasNext: false, hasPrev: false } };
      }

      filter.$or = [
        ...(userIds.length  ? [{ user_id:  { $in: userIds  } }] : []),
        ...(habitIds.length ? [{ habit_id: { $in: habitIds } }] : []),
      ];
    }

    const { data: logs, pagination } = await paginate(HabitLogs, filter, page, limit, { sort: { date: -1 } });

    // Enrichir avec noms en une seule passe
    const userIds  = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
    const habitIds = [...new Set(logs.map(l => l.habit_id).filter(Boolean))];

    const [users, habits] = await Promise.all([
      userIds.length  ? Users.find({ _id: { $in: userIds } })  : [],
      habitIds.length ? Habits.find({ _id: { $in: habitIds } }) : [],
    ]);

    const userMap  = new Map(users.map(u  => [String(u._id), `${u.firstName ?? u.prenom ?? ""} ${u.lastName ?? u.nom ?? ""}`.trim() || u.email]));
    const habitMap = new Map(habits.map(h => [String(h._id), h.nom]));

    const enriched = logs.map(log => ({
      ...log,
      userName: userMap.get(String(log.user_id))   ?? "Compte supprimé",
      habitNom: habitMap.get(String(log.habit_id)) ?? `[${String(log.habit_id ?? "").slice(0, 8)}…]`,
    }));

    return { data: enriched, pagination };
  }

  static async getLogById(id, userId, permissions) {
    const log = await HabitLogs.findById(id);
    if (!log) throw new AppError(ErrorMessages[ErrorsCodes.LOG_NOT_FOUND], 404, ErrorsCodes.LOG_NOT_FOUND);

    const habit = await Habits.findById(log.habit_id);
    if (!_canAccess(userId, permissions, habit, log)) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);
    return log;
  }

  static async updateLog(id, body, userId, permissions) {
    const log = await HabitLogs.findById(id);
    if (!log) throw new AppError(ErrorMessages[ErrorsCodes.LOG_NOT_FOUND], 404, ErrorsCodes.LOG_NOT_FOUND);

    const habit = await Habits.findById(log.habit_id);
    if (!_canMutate(userId, permissions, habit, log)) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const { utilisateur_id: _a, utilisateurId: _b, user_id: _c, ...safeBody } = body ?? {};
    return HabitLogs.updateOne({ _id: id }, { $set: safeBody });
  }

  static async deleteLog(id, userId, permissions) {
    const log = await HabitLogs.findById(id);
    if (!log) throw new AppError(ErrorMessages[ErrorsCodes.LOG_NOT_FOUND], 404, ErrorsCodes.LOG_NOT_FOUND);

    const habit = await Habits.findById(log.habit_id);
    if (!_canMutate(userId, permissions, habit, log)) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    await HabitLogs.deleteOne({ _id: id });
  }

  static async getIncompleteForDate(dateStr, userId) {
    const targetDate = new Date(dateStr);
    if (Number.isNaN(targetDate.getTime())) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_DATE], 400, ErrorsCodes.INVALID_DATE);

    const habits  = await Habits.find({ $or: [{ user_id: userId }, { visible_pour_tous: true }] });
    const habitIds = habits.map(h => h._id);
    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

    const logs = await HabitLogs.find({ habit_id: { $in: habitIds }, date: { $gte: dayStart, $lte: dayEnd } });

    const incomplete = [];
    for (const habit of habits) {
      const log = logs.find(l => l.habit_id === habit._id);
      if (log && log.statut === "manquee") {
        incomplete.push({ habit_id: habit._id, nom: habit.nom, categorie: habit.categorie, frequence: habit.frequence, current_status: log.statut, has_photo: !!log?.photo_url });
      }
    }
    return { date: targetDate.toISOString().split("T")[0], incomplete_habits: incomplete };
  }

  static async catchupLog(body, userId, permissions) {
    const { habit_id, date, note, photo_url } = body;
    if (!habit_id || !date || !note) throw new AppError(ErrorMessages[ErrorsCodes.FIELDS_REQUIRED], 400, ErrorsCodes.FIELDS_REQUIRED);

    const habit = await Habits.findById(habit_id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.HABIT_NOT_FOUND], 404, ErrorsCodes.HABIT_NOT_FOUND);

    const isOwner = habit.user_id === userId;
    const isAdmin = permissions.includes("LOGS_MANAGE") || permissions.includes("ALL");
    if (!isOwner && !isAdmin) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const targetDate = new Date(date);
    if (Number.isNaN(targetDate.getTime())) throw new AppError(ErrorMessages[ErrorsCodes.INVALID_DATE], 400, ErrorsCodes.INVALID_DATE);

    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

    const existing = await HabitLogs.findOne({ habit_id, date: { $gte: dayStart, $lte: dayEnd }, user_id: userId });

    const fields = {
      statut:     "completee",
      note,
      retroactif: true,
      ...(photo_url ? { photo_url } : {}),
    };

    if (existing) {
      return HabitLogs.updateOne({ _id: existing._id }, { $set: fields });
    }
    return HabitLogs.insertOne({ habit_id, user_id: userId, date: targetDate, ...fields });
  }
}

export default HabitLogsService;
