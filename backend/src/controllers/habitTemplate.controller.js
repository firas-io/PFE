/**
 * habitTemplate.controller.js
 * Business logic for habit templates (list + create-from-template).
 * Extracted from HabitTemplateRoutes.js
 */
const Habit = require("../models/Habit");
const HabitTemplate = require("../models/HabitTemplate");
const {
  normalizeStatus,
  normalizeCategorie,
  normalizePriorite,
  normalizeFrequence,
  normalizeObjectif,
  normalizeWeekDays,
  normalizeHorairesCibles,
  canSetVisiblePourTous,
  parseVisiblePourTous
} = require("../utils/habitNormalize");

// GET /habits/templates — Library of habit templates
exports.getTemplates = async (req, reply) => {
  try {
    const templates = await HabitTemplate.find();
    return templates;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// POST /habits/from-template/:templateId — Create a habit from a template
exports.createFromTemplate = async (req, reply) => {
  try {
    const template = await HabitTemplate.findById(req.params.templateId);
    if (!template) {
      reply.code(404);
      return { error: "Template not found" };
    }

    const body = req.body ?? {};
    const statut = normalizeStatus(body.statut ?? body.status) || "active";

    const nom = body.nom ?? body.titre ?? template.nom_template;

    const categorie = body.categorie !== undefined ? normalizeCategorie(body.categorie) : template.categorie;
    const priorite = body.priorite !== undefined ? normalizePriorite(body.priorite) : template.priorite;
    const frequence = normalizeFrequence(body.frequence, body) ?? template.frequence;
    const normalizedObjective = normalizeObjectif(body);

    let visible_pour_tous = false;
    const wantVisible = parseVisiblePourTous(body);
    if (wantVisible === true && canSetVisiblePourTous(req)) visible_pour_tous = true;

    const habit = await Habit.create({
      utilisateur_id: req.user.id,
      visible_pour_tous,
      nom: String(nom).trim(),
      description: body.description !== undefined ? body.description : template.description,
      categorie,
      priorite,
      frequence,
      jours_specifiques: normalizeWeekDays(body.jours_specifiques ?? body.joursSpecifiques) ?? template.jours_specifiques,
      fois_par_semaine: body.fois_par_semaine ?? body.foisParSemaine ?? template.fois_par_semaine,
      horaires_cibles: normalizeHorairesCibles(body.horaires_cibles ?? body.horairesCibles) ?? template.horaires_cibles,
      heure_precise: body.heure_precise ?? body.heurePrecise ?? template.heure_precise,
      objectif_valeur: normalizedObjective.objectif_valeur ?? template.objectif_valeur,
      objectif_unite: normalizedObjective.objectif_unite ?? template.objectif_unite,
      objectif_detail: normalizedObjective.objectif_detail ?? template.objectif_detail,
      statut,
      date_archivage: statut === "archived" ? new Date() : undefined
    });

    return habit;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};
