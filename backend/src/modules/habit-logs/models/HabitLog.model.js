import { BaseModel } from "@/core/base.model.js";

class HabitLogModel extends BaseModel {
  constructor() { super("habit-logs"); }
}

export const HabitLogs = new HabitLogModel();
export default HabitLogs;
