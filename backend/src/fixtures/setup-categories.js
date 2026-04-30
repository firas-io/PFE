import { Categories } from "@/modules/categories/models/Category.model.js";
import { CATEGORIES }  from "@/shared/constants/categories.js";

export async function setupCategories() {
  try {
    for (const cat of Object.values(CATEGORIES)) {
      const existing = await Categories.findOne({ slug: cat.slug });
      if (!existing) {
        await Categories.insertOne({
          ...cat,
          is_default: true,
          is_active:  true,
          created_at: new Date(),
        });
      }
    }
  } catch (err) {
    console.error("setupCategories error:", err.message ?? err);
  }
}
