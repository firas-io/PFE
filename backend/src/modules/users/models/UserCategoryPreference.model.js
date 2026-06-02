import { BaseModel } from "@/core/base.model.js";

class UserCategoryPreferenceModel extends BaseModel {
  constructor() { super("user_category_preferences"); }

  async findAllByUser(userId) {
    return this.find({ user_id: userId }, { sort: { created_at: 1 } });
  }

  async findByUserAndSlug(userId, category_slug) {
    return this.findOne({ user_id: userId, category_slug });
  }

  async getSlugsForUser(userId) {
    const prefs = await this.findAllByUser(userId);
    return prefs.map(p => p.category_slug);
  }
}

export const UserCategoryPreferences = new UserCategoryPreferenceModel();
export default UserCategoryPreferences;
