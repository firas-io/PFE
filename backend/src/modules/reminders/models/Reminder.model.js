import { BaseModel } from "@/core/base.model.js";

class ReminderModel extends BaseModel {
  constructor() { super("reminders"); }
}

export const Reminders = new ReminderModel();
export default Reminders;
