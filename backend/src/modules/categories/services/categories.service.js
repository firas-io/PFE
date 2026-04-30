import { Categories } from "../models/Category.model.js";
import { AppError }   from "@/core/errors.js";
import logger         from "@/utils/logger.util.js";

function slugify(input) {
  return String(input)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
}

class CategoriesService {
  static async getAll() {
    return Categories.find({}, { sort: { is_default: -1, label: 1 } });
  }

  static async getActive() {
    return Categories.find({ is_active: true }, { sort: { is_default: -1, label: 1 } });
  }

  static async getBySlug(slug) {
    return Categories.findOne({ slug });
  }

  static async create(body, adminId) {
    const { label, icon = "Circle", color = "#6b7280", layout = "default", description = "", fields = [] } = body;
    if (!label?.trim()) throw new AppError("Le label est requis", 400, "CAT-001");

    const slug = body.slug?.trim() ? String(body.slug).trim() : slugify(label);
    const existing = await Categories.findOne({ slug });
    if (existing) throw new AppError("Ce slug existe déjà", 409, "CAT-002");

    logger.info({ action: "create-category", slug, adminId }, "Category created");
    return Categories.insertOne({
      slug, label: String(label).trim(), icon, color, layout, description,
      fields: Array.isArray(fields) ? fields : [],
      is_default: false, is_active: true, created_by: adminId, created_at: new Date(),
    });
  }

  static async update(id, body) {
    const cat = await Categories.findById(id);
    if (!cat) throw new AppError("Catégorie introuvable", 404, "CAT-003");

    const patch = {};
    if (body.label       !== undefined) patch.label       = String(body.label).trim();
    if (body.icon        !== undefined) patch.icon        = String(body.icon).trim();
    if (body.color       !== undefined) patch.color       = String(body.color).trim();
    if (body.layout      !== undefined) patch.layout      = String(body.layout).trim();
    if (body.description !== undefined) patch.description = String(body.description).trim();
    if (body.fields      !== undefined) patch.fields      = Array.isArray(body.fields) ? body.fields : cat.fields;
    if (body.is_active   !== undefined) patch.is_active   = Boolean(body.is_active);

    return Categories.updateOne({ _id: id }, { $set: patch });
  }

  static async delete(id) {
    const cat = await Categories.findById(id);
    if (!cat) throw new AppError("Catégorie introuvable", 404, "CAT-003");
    if (cat.is_default) throw new AppError("Les catégories par défaut ne peuvent pas être supprimées", 403, "CAT-004");
    await Categories.deleteOne({ _id: id });
    logger.info({ action: "delete-category", id }, "Category deleted");
  }
}

export default CategoriesService;
