import { BaseModel } from "@/core/base.model.js";

class SessionModel extends BaseModel {
  constructor() { super("sessions"); }
}

export const Sessions = new SessionModel();
export default Sessions;
