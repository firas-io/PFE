import { StatusCodes as httpStatus } from "http-status-codes";
import CategoriesService             from "../services/categories.service.js";
import { getCategory }               from "@/shared/constants/categories.js";
import { Users }                     from "@/modules/users/models/User.model.js";
import { UserCategoryPreferences }   from "@/modules/users/models/UserCategoryPreference.model.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

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

// GET /categories — active from DB + user custom categories
const list = _h(async (req, reply) => {
  const [dbCategories, user] = await Promise.all([
    CategoriesService.getActive(),
    Users.findById(req.user.id),
  ]);
  const customCategories = (user?.custom_categories ?? []).map(_buildCustomCategory);
  // Exclude the 'autre' default category (hidden template used by custom cats)
  const filtered = dbCategories.filter(c => c.slug !== "autre");
  reply.send([...filtered, ...customCategories]);
});

// GET /categories/:slug
const getBySlug = _h(async (req, reply) => {
  const slug = String(req.params.slug || "").trim();

  const cat = await CategoriesService.getBySlug(slug);
  if (cat) return reply.send(cat);

  // Fallback: user custom category (ticket_id as slug)
  const user   = await Users.findById(req.user.id);
  const custom = (user?.custom_categories ?? []).find((c) => c.ticket_id === slug);
  if (custom) return reply.send(_buildCustomCategory(custom));

  reply.code(404).send({ code: "CAT-003", message: "Catégorie introuvable" });
});

// GET /categories/available-for-user — active categories NOT yet selected by user
const availableForUser = _h(async (req, reply) => {
  const [dbCategories, selectedSlugs] = await Promise.all([
    CategoriesService.getActive(),
    UserCategoryPreferences.getSlugsForUser(req.user.id),
  ]);
  const selectedLower = new Set(selectedSlugs.map((s) => String(s).toLowerCase()));
  const available = dbCategories.filter(
    (c) => c.slug !== "autre" && !selectedLower.has(String(c.slug).toLowerCase())
  );
  reply.send(available);
});

// GET /admin/categories — all (including inactive) for admin panel
const listAll = _h(async (_req, reply) => {
  reply.send(await CategoriesService.getAll());
});

// POST /admin/categories
const create = _h(async (req, reply) => {
  reply.code(httpStatus.CREATED).send(await CategoriesService.create(req.body, req.user.id));
});

// PATCH /admin/categories/:id
const update = _h(async (req, reply) => {
  reply.send(await CategoriesService.update(req.params.id, req.body));
});

// DELETE /admin/categories/:id
const remove = _h(async (req, reply) => {
  await CategoriesService.delete(req.params.id);
  reply.code(httpStatus.NO_CONTENT).send(null);
});

const CategoriesController = { list, getBySlug, availableForUser, listAll, create, update, remove };
export default CategoriesController;
