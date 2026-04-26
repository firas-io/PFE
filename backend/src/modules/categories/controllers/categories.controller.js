import { StatusCodes as httpStatus } from "http-status-codes";
import { AppError } from "@/core/errors.js";
import { getCategory, getPublicCategories } from "@/shared/constants/categories.js";
import { Users } from "@/modules/users/models/User.model.js";

const _autreTheme = getCategory("autre");

function _buildCustomCategory(custom) {
  return {
    slug:        custom.ticket_id,
    label:       custom.label,
    icon:        _autreTheme.icon,
    color:       _autreTheme.color,
    layout:      _autreTheme.layout,
    description: _autreTheme.description,
    fields:      _autreTheme.fields,
    is_custom:   true,
  };
}

const list = async (req, reply) => {
  const defaults = getPublicCategories().filter((c) => c.slug !== "autre");

  const user = await Users.findById(req.user.id);
  const customCategories = (user?.custom_categories ?? []).map(_buildCustomCategory);

  reply.send([...defaults, ...customCategories]);
};

const getBySlug = async (req, reply) => {
  const slug = String(req.params.slug || "").trim();

  // Standard categories (exclude "autre" — hidden template)
  const cat = getCategory(slug);
  if (cat && cat.slug !== "autre") {
    return reply.send(cat);
  }

  // Custom category: slug is the ticket_id stored in user.custom_categories
  const user = await Users.findById(req.user.id);
  const custom = (user?.custom_categories ?? []).find((c) => c.ticket_id === slug);
  if (custom) {
    return reply.send(_buildCustomCategory(custom));
  }

  throw new AppError("Catégorie inconnue", httpStatus.NOT_FOUND, "CAT-001");
};

const CategoriesController = { list, getBySlug };
export default CategoriesController;
