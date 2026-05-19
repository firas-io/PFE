import { BaseModel } from "@/core/base.model.js";

class UserHabitSettingsModel extends BaseModel {
  constructor() {
    super("user_habit_settings");
  }

  async findByUserAndHabit(userId, habitId) {
    return (await this._getCollection()).findOne({ user_id: userId, habit_id: habitId });
  }

  async findAllByUser(userId) {
    return (await this._getCollection()).find({ user_id: userId }).toArray();
  }
}

export const UserHabitSettings = new UserHabitSettingsModel();
export default UserHabitSettings;

