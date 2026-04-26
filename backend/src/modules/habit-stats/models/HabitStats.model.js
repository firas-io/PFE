import { BaseModel } from "@/core/base.model.js";
class HabitStatsModel extends BaseModel { constructor() { super("habit-stats"); } }
export const HabitStats = new HabitStatsModel();
export default HabitStats;
