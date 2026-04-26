import { HabitStats } from "../models/HabitStats.model.js";
import { Habits }     from "@/modules/habits/models/Habit.model.js";
import { AppError }   from "@/core/errors.js";
import { ErrorsCodes, ErrorMessages } from "../constants/habit-stats.constants.js";

class HabitStatsService {
  static async createStats(body)  { return HabitStats.insertOne(body); }
  static async getAllStats()      { return HabitStats.find(); }

  static async _checkAccess(stats, userId, permissions) {
    const habit   = await Habits.findById(stats.habit_id);
    const isAdmin = permissions.includes("STATS_VIEW") || permissions.includes("ALL");
    const shared  = habit?.visible_pour_tous === true;
    if (habit?.user_id !== userId && !isAdmin && !shared)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);
  }

  static async getStatsById(id, userId, permissions) {
    const stats = await HabitStats.findById(id);
    if (!stats) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);
    await HabitStatsService._checkAccess(stats, userId, permissions);
    return stats;
  }

  static async getStatsByHabit(habitId, userId, permissions) {
    const stats = await HabitStats.findOne({ habit_id: habitId });
    if (!stats) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);
    await HabitStatsService._checkAccess(stats, userId, permissions);
    return stats;
  }
}
export default HabitStatsService;
