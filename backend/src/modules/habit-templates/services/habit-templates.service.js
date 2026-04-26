import { HabitTemplates } from "../models/HabitTemplate.model.js";
import { Habits }         from "@/modules/habits/models/Habit.model.js";
import { AppError }       from "@/core/errors.js";
import {
  normalizeStatus, normalizeCategorie, normalizePriorite, normalizeFrequence,
  normalizeObjectif, normalizeWeekDays, normalizeHorairesCibles,
  canSetVisiblePourTous, parseVisiblePourTous
} from "@/utils/habit-normalize.js";
import { isValidCategory } from "@/shared/constants/categories.js";
import { ErrorsCodes, ErrorMessages } from "../constants/habit-templates.constants.js";

class HabitTemplatesService {
  static async getTemplates() { return HabitTemplates.find(); }

  static async createFromTemplate(templateId, body, userId, req) {
    const template = await HabitTemplates.findById(templateId);
    if (!template) throw new AppError(ErrorMessages[ErrorsCodes.TEMPLATE_NOT_FOUND], 404, ErrorsCodes.TEMPLATE_NOT_FOUND);

    const safeBody  = body ?? {};
    const statut    = normalizeStatus(safeBody.statut ?? safeBody.status) || "active";
    const nom       = safeBody.nom ?? safeBody.titre ?? template.nom_template;
    let categorie = safeBody.categorie !== undefined ? normalizeCategorie(safeBody.categorie) : template.categorie;
    if (!isValidCategory(categorie)) categorie = "autre";
    const priorite  = safeBody.priorite  !== undefined ? normalizePriorite(safeBody.priorite)  : template.priorite;
    const frequence = normalizeFrequence(safeBody.frequence, safeBody) ?? template.frequence;
    const obj       = normalizeObjectif(safeBody);

    let visible_pour_tous = false;
    const wantVisible = parseVisiblePourTous(safeBody);
    if (wantVisible === true && canSetVisiblePourTous(req)) visible_pour_tous = true;

    return Habits.insertOne({
      user_id: userId, visible_pour_tous,
      nom: String(nom).trim(),
      description:       safeBody.description !== undefined ? safeBody.description : template.description,
      categorie, priorite, frequence,
      jours_specifiques: normalizeWeekDays(safeBody.jours_specifiques ?? safeBody.joursSpecifiques) ?? template.jours_specifiques,
      fois_par_semaine:  safeBody.fois_par_semaine ?? safeBody.foisParSemaine ?? template.fois_par_semaine,
      horaires_cibles:   normalizeHorairesCibles(safeBody.horaires_cibles ?? safeBody.horairesCibles) ?? template.horaires_cibles,
      heure_precise:     safeBody.heure_precise ?? safeBody.heurePrecise ?? template.heure_precise,
      objectif_valeur:   obj.objectif_valeur ?? template.objectif_valeur,
      objectif_unite:    obj.objectif_unite  ?? template.objectif_unite,
      objectif_detail:   obj.objectif_detail ?? template.objectif_detail,
      statut,
      date_archivage: statut === "archived" ? new Date() : undefined
    });
  }
}
export default HabitTemplatesService;
