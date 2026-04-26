import { BaseModel } from "@/core/base.model.js";
class HabitTemplateModel extends BaseModel { constructor() { super("habit-templates"); } }
export const HabitTemplates = new HabitTemplateModel();
export default HabitTemplates;
