import { BaseModel } from "@/core/base.model.js";
class OffDayModel extends BaseModel { constructor() { super("off-days"); } }
export const OffDays = new OffDayModel();
export default OffDays;
