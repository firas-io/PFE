import { BaseModel } from "@/core/base.model.js";

class HabitNoteHistoryModel extends BaseModel {
  constructor() { super("habit-note-histories"); }
}

export const HabitNoteHistories = new HabitNoteHistoryModel();
export default HabitNoteHistories;
