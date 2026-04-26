import { BaseModel } from "@/core/base.model.js";

class RoleModel extends BaseModel {
  constructor() { super("roles"); }
}

export const Roles = new RoleModel();
export default Roles;
