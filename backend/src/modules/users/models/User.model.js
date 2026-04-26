import { BaseModel } from "@/core/base.model.js";

class UserModel extends BaseModel {
  constructor() { super("users"); }
}

export const Users = new UserModel();
export default Users;
