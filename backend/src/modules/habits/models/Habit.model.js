import { BaseModel } from "@/core/base.model.js";

class HabitModel extends BaseModel {
  constructor() { super("habits"); }
}

export const Habits = new HabitModel();
export default Habits;
