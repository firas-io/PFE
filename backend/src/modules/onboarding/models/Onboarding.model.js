import { BaseModel } from "@/core/base.model.js";

class OnboardingModel extends BaseModel {
  constructor() { super("onboardings"); }
}

export const Onboardings = new OnboardingModel();
export default Onboardings;
