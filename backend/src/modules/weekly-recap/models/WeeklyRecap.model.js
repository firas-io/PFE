import { BaseModel } from "@/core/base.model.js";
class WeeklyRecapModel extends BaseModel { constructor() { super("weekly-recaps"); } }
export const WeeklyRecaps = new WeeklyRecapModel();
export default WeeklyRecaps;
