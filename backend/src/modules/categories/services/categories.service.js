import { Categories } from "../models/Category.model.js";
import { AppError }   from "@/core/errors.js";
import logger         from "@/utils/logger.util.js";
import {
  isValidCategory,
  getCategory,
  resolveCategorieSlug,
} from "@/shared/constants/categories.js";

/** Treat missing is_active as active (legacy rows). */
const ACTIVE_FILTER = { is_active: { $ne: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class CategoriesService {
  static async getAll() {
    return Categories.find({}, { sort: { is_default: -1, label: 1 } });
  }

  static async getActive() {
    return Categories.find(ACTIVE_FILTER, { sort: { is_default: -1, label: 1 } });
  }

  static async getBySlug(slug) {
    return Categories.findOne({ slug });
  }

  /**
   * Resolves a category reference to an active slug.
   * Accepts built-in slugs, MongoDB slugs (any casing), document _id, or label.
   */
  static async resolveActiveSlug(rawSlug) {
    if (rawSlug == null || String(rawSlug).trim() === "") return null;
    const raw = String(rawSlug).trim();

    const normalized = resolveCategorieSlug(raw);
    if (normalized && isValidCategory(normalized)) return normalized;

    const trySlug = async (candidate) => {
      if (!candidate) return null;
      let row = await Categories.findOne({ slug: candidate, ...ACTIVE_FILTER });
      if (row?.slug) return row.slug;
      row = await Categories.findOne({
        slug: { $regex: new RegExp(`^${escapeRegex(candidate)}$`, "i") },
        ...ACTIVE_FILTER,
      });
      return row?.slug ?? null;
    };

    if (normalized) {
      const hit = await trySlug(normalized);
      if (hit) return hit;
    }

    if (UUID_RE.test(raw)) {
      const row = await Categories.findById(raw);
      if (row?.slug && row.is_active !== false) return row.slug;
    }

    const byLabel = await Categories.findOne({
      label: { $regex: new RegExp(`^${escapeRegex(raw)}$`, "i") },
      ...ACTIVE_FILTER,
    });
    if (byLabel?.slug) return byLabel.slug;

    if (raw !== normalized) {
      const hit = await trySlug(raw);
      if (hit) return hit;
    }

    return null;
  }

  /** Field definitions for habit dynamic fields (constants + DB). */
  static async getCategoryDef(slug) {
    const builtIn = getCategory(slug);
    if (builtIn) return builtIn;
    let row = await Categories.findOne({ slug, ...ACTIVE_FILTER });
    if (!row) {
      row = await Categories.findOne({
        slug: { $regex: new RegExp(`^${escapeRegex(slug)}$`, "i") },
        ...ACTIVE_FILTER,
      });
    }
    if (row) {
      return {
        slug:        row.slug,
        label:       row.label,
        icon:        row.icon,
        color:       row.color,
        layout:      row.layout,
        description: row.description ?? "",
        fields:      Array.isArray(row.fields) ? row.fields : [],
      };
    }
    return getCategory("autre");
  }

  static async create(body, adminId) {
    const { label, icon = "Circle", color = "#6b7280", layout = "default", description = "", fields = [] } = body;
    if (!label?.trim()) throw new AppError("Le label est requis", 400, "CAT-001");

    const slug = resolveCategorieSlug(body.slug?.trim() || label);
    if (!slug) throw new AppError("Impossible de générer un slug pour cette catégorie", 400, "CAT-001");

    const existing = await Categories.findOne({
      slug: { $regex: new RegExp(`^${escapeRegex(slug)}$`, "i") },
    });
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
