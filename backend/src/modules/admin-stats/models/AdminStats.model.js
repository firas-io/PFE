import { BaseModel } from "@/core/base.model.js";
class AdminStatsModel extends BaseModel { constructor() { super("admin-stats"); } }
export const AdminStats = new AdminStatsModel();
export default AdminStats;
