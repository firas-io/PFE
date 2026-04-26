import { Habits }             from "../models/Habit.model.js";
import { HabitNoteHistories } from "../models/HabitNoteHistory.model.js";
import { HabitLogs }          from "@/modules/habit-logs/models/HabitLog.model.js";
import { HabitStats }         from "@/modules/habit-stats/models/HabitStats.model.js";
import { Reminders }          from "@/modules/reminders/models/Reminder.model.js";
import { OffDays }            from "@/modules/off-days/models/OffDay.model.js";
import { Users }              from "@/modules/users/models/User.model.js";
import { withCanonicalUserFields } from "@/modules/users/utils/user-fields.js";
import { AppError }           from "@/core/errors.js";
import logger                 from "@/utils/logger.util.js";
import {
  normalizeHabitPayload, normalizeStatus,
  canSetVisiblePourTous, parseVisiblePourTous,
  normalizeFrequence, normalizeObjectif,
  normalizeWeekDays, normalizeHorairesCibles
} from "@/utils/habit-normalize.js";
import { ErrorsCodes, ErrorMessages } from "../constants/habits.constants.js";
import {
  isValidCategory,
  getCategory,
  CATEGORY_SLUGS,
  resolveCategorieSlug,
} from "@/shared/constants/categories.js";

function _explicitCategorieInBody(body) {
  const raw = body?.categorie ?? body?.category;
  return raw !== undefined && raw !== null && String(raw).trim() !== "";
}

function _applyCategorieWriteValidation(body, payload, { isCreate }) {
  const explicit = _explicitCategorieInBody(body);
  if (isCreate) {
    if (!explicit) payload.categorie = "autre";
    else {
      const slug = payload.categorie ?? resolveCategorieSlug(body.categorie ?? body.category);
      if (!isValidCategory(slug)) {
        throw new AppError(
          `Catégorie invalide. Valeurs acceptées : ${CATEGORY_SLUGS.join(", ")}`,
          400,
          ErrorsCodes.INVALID_CATEGORY
        );
      }
      payload.categorie = slug;
    }
  } else if (explicit) {
    const slug = payload.categorie ?? resolveCategorieSlug(body.categorie ?? body.category);
    if (!isValidCategory(slug)) {
      throw new AppError(
        `Catégorie invalide. Valeurs acceptées : ${CATEGORY_SLUGS.join(", ")}`,
        400,
        ErrorsCodes.INVALID_CATEGORY
      );
    }
    payload.categorie = slug;
  }
}

function _sanitizeCategorieChamps(payload, effectiveCategorieSlug) {
  if (payload.categorie_champs === undefined) return;
  if (payload.categorie_champs === null) return;
  if (typeof payload.categorie_champs !== "object" || Array.isArray(payload.categorie_champs)) {
    delete payload.categorie_champs;
    return;
  }
  const def = getCategory(String(effectiveCategorieSlug)) ?? getCategory("autre");
  if (!def?.fields?.length) return;
  const allowed = new Set(def.fields.map((f) => f.name));
  const next = {};
  for (const [k, v] of Object.entries(payload.categorie_champs))
    if (allowed.has(k)) next[k] = v;
  payload.categorie_champs = next;
}

function _applyCustomCategorieMeta(body, payload, effectiveCategorieSlug) {
  const rawLabel = body?.categorie_label ?? body?.categorieLabel;
  const rawTicketId = body?.categorie_ticket_id ?? body?.categorieTicketId;
  const isOther = String(effectiveCategorieSlug || "") === "autre";

  if (rawLabel !== undefined) {
    const normalized = String(rawLabel).trim();
    if (isOther && normalized) payload.categorie_label = normalized.slice(0, 80);
    else delete payload.categorie_label;
  }
  if (rawTicketId !== undefined) {
    const normalizedTicketId = String(rawTicketId).trim();
    if (isOther && normalizedTicketId) payload.categorie_ticket_id = normalizedTicketId;
    else delete payload.categorie_ticket_id;
  }
}

class HabitsService {
  static async _hydrateNotesEntries(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return [];
    const userIds = [...new Set(entries.map((e) => String(e.user_id || "")).filter(Boolean))];
    const habitIds = [...new Set(entries.map((e) => String(e.habit_id || "")).filter(Boolean))];
    const [users, habits] = await Promise.all([
      Promise.all(userIds.map((id) => Users.findById(id))),
      Promise.all(habitIds.map((id) => Habits.findById(id))),
    ]);

    const userMap = new Map(users.filter(Boolean).map((u) => [String(u._id), withCanonicalUserFields(u)]));
    const habitMap = new Map(habits.filter(Boolean).map((h) => [String(h._id), h]));

    return entries.map((entry) => ({
      ...entry,
      user_id: userMap.get(String(entry.user_id)) || entry.user_id,
      habit_id: habitMap.get(String(entry.habit_id)) || entry.habit_id,
    }));
  }

  // Rejects if any of the provided Date objects falls on a holiday off-day.
  // Validation is limited to type="holiday"; maintenance/special/other are permitted.
  // jours_specifiques (recurring weekdays) are NOT validated here — that concern
  // belongs to the habit-log module at log time (P1 scope).
  static async _validateDatesAgainstOffDays(datesSpecifiques) {
    if (!Array.isArray(datesSpecifiques) || datesSpecifiques.length === 0) return;

    // Normalize to UTC midnight to match off_days storage format
    const dateObjects = datesSpecifiques.map(d => {
      const dt = new Date(d);
      dt.setUTCHours(0, 0, 0, 0);
      return dt;
    });

    const conflicting = await OffDays.find({ type: "holiday", date: { $in: dateObjects } });

    if (conflicting.length > 0) {
      const conflicts = conflicting.map(o => ({
        date:  new Date(o.date).toISOString().slice(0, 10),
        label: o.label,
      }));
      const err = new AppError(ErrorMessages[ErrorsCodes.DATE_IS_OFF], 400, ErrorsCodes.DATE_IS_OFF);
      err.conflicts = conflicts;
      throw err;
    }
  }

  static async createHabit(body, userId, req) {
    const habitPayload = normalizeHabitPayload(body, { requireNom: true });
    if (!habitPayload) throw new AppError(ErrorMessages[ErrorsCodes.NOM_REQUIRED], 400, ErrorsCodes.NOM_REQUIRED);

    _applyCategorieWriteValidation(body, habitPayload, { isCreate: true });
    _sanitizeCategorieChamps(habitPayload, habitPayload.categorie);
    _applyCustomCategorieMeta(body, habitPayload, habitPayload.categorie);

    await HabitsService._validateDatesAgainstOffDays(habitPayload.dates_specifiques);

    let visible_pour_tous = false;
    const wantVisible = parseVisiblePourTous(body);
    if (wantVisible === true) {
      if (!canSetVisiblePourTous(req))
        throw new AppError("Vous n'avez pas le droit d'activer la visibilité publique", 403, "HABIT-006");
      visible_pour_tous = true;
    }

    logger.info({ action: "create-habit", userId }, "Habit created");
    return Habits.insertOne({ ...habitPayload, user_id: userId, visible_pour_tous });
  }

  static async getAllHabits(query) {
    const status = normalizeStatus(query?.statut ?? query?.status);
    return Habits.find(status ? { statut: status } : {});
  }

  static async getMyHabits(userId, query) {
    const status          = normalizeStatus(query?.statut ?? query?.status);
    const includeArchived = query?.includeArchived === "true" || query?.includeArchived === true;
    const statusClause    = status
      ? { statut: status }
      : !includeArchived
        ? { $or: [{ statut: { $in: ["active", "pause"] } }, { statut: { $exists: false } }, { statut: null }] }
        : {};
    return Habits.find({ $or: [{ user_id: userId, ...statusClause }, { visible_pour_tous: true, ...statusClause }] });
  }

  static async getHabitById(id, userId, permissions) {
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);

    const isAdmin = permissions.includes("HABITS_VIEW") || permissions.includes("ALL");
    if (habit.user_id !== userId && !isAdmin && habit.visible_pour_tous !== true)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    return habit;
  }

  static async updateHabit(id, body, userId, req) {
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);

    const isAdmin = (req.user.permissions || []).includes("ALL") || (req.user.permissions || []).includes("HABITS_MANAGE");
    if (habit.user_id !== userId && !isAdmin) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const payload     = normalizeHabitPayload(body, { requireNom: false });
    const wantVisible = parseVisiblePourTous(body);
    if (wantVisible !== undefined && canSetVisiblePourTous(req)) payload.visible_pour_tous = wantVisible;

    _applyCategorieWriteValidation(body, payload, { isCreate: false });
    const effectiveCat = payload.categorie !== undefined ? payload.categorie : habit.categorie;
    _applyCustomCategorieMeta(body, payload, effectiveCat);
    if (payload.categorie_champs !== undefined)
      _sanitizeCategorieChamps(payload, effectiveCat);

    if (payload.dates_specifiques) {
      await HabitsService._validateDatesAgainstOffDays(payload.dates_specifiques);
    }

    return Habits.updateOne({ _id: id }, { $set: payload });
  }

  static async updateHabitStatus(id, body, userId, permissions) {
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);

    const isAdmin = (permissions || []).includes("ALL");
    const ownerId = String(habit.user_id ?? "");
    const requesterId = String(userId ?? "");
    const isOwner = ownerId && requesterId && ownerId === requesterId;
    const sharedRaw = habit.visible_pour_tous;
    const isSharedHabit = sharedRaw === true || sharedRaw === "true" || sharedRaw === 1 || sharedRaw === "1";
    if (!isOwner && !isAdmin && !isSharedHabit)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const statut = normalizeStatus(body?.statut ?? body?.status);
    if (!statut) throw new AppError("statut/status is required (active|pause|archived)", 400, "HABIT-004");

    if (statut === "archived")
      return Habits.updateOne({ _id: id }, { $set: { statut, date_archivage: new Date() } });

    return Habits.updateOne({ _id: id }, { $set: { statut }, $unset: { date_archivage: "" } });
  }

  static async updateHabitNotes(id, body, userId) {
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);

    if (habit.user_id !== userId && habit.visible_pour_tous !== true)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const newNote = body?.note !== undefined ? body.note : undefined;
    const oldNote = habit.note || null;

    if (oldNote !== newNote) {
      await HabitNoteHistories.insertOne({
        habit_id: id, user_id: userId,
        old_note: oldNote, new_note: newNote,
        action: oldNote ? "updated" : "created",
      });
    }

    return Habits.updateOne({ _id: id }, { $set: { note: newNote } });
  }

  static async getNoteHistory(id, userId, permissions) {
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);

    const isAdmin = permissions.includes("HABITS_MANAGE") || permissions.includes("ALL");
    if (habit.user_id !== userId && !isAdmin && habit.visible_pour_tous !== true)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    return HabitNoteHistories.find({ habit_id: id }, { sort: { createdAt: -1 } });
  }

  static async cloneHabit(id, body, userId, req) {
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);

    const isAdmin      = (req.user.permissions || []).includes("HABITS_MANAGE") || (req.user.permissions || []).includes("ALL");
    const canCloneShared = habit.visible_pour_tous === true;
    if (habit.user_id !== userId && !isAdmin && !canCloneShared)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    const bodyPayload = normalizeHabitPayload(body ?? {}, { requireNom: false }) || {};
    _applyCategorieWriteValidation(body ?? {}, bodyPayload, { isCreate: false });
    const statut      = normalizeStatus(body?.statut ?? body?.status) || "active";

    const cloneCategorie = bodyPayload.categorie !== undefined ? bodyPayload.categorie : habit.categorie;
    if (bodyPayload.categorie_champs !== undefined)
      _sanitizeCategorieChamps(bodyPayload, cloneCategorie);

    return Habits.insertOne({
      user_id: userId,
      nom:               bodyPayload.nom              || `${habit.nom} (copie)`,
      description:       bodyPayload.description      ?? habit.description,
      categorie:         cloneCategorie,
      categorie_champs:  bodyPayload.categorie_champs !== undefined ? bodyPayload.categorie_champs : habit.categorie_champs,
      frequence:         bodyPayload.frequence        ?? habit.frequence,
      jours_specifiques: bodyPayload.jours_specifiques ?? habit.jours_specifiques,
      fois_par_semaine:  bodyPayload.fois_par_semaine  ?? habit.fois_par_semaine,
      horaires_cibles:   bodyPayload.horaires_cibles   ?? habit.horaires_cibles,
      heure_precise:     bodyPayload.heure_precise     ?? habit.heure_precise,
      priorite:          bodyPayload.priorite          ?? habit.priorite,
      objectif_valeur:   bodyPayload.objectif_valeur   ?? habit.objectif_valeur,
      objectif_unite:    bodyPayload.objectif_unite    ?? habit.objectif_unite,
      objectif_detail:   bodyPayload.objectif_detail   ?? habit.objectif_detail,
      statut,
      date_archivage: statut === "archived" ? new Date() : undefined
    });
  }

  static async archiveHabit(id, userId, permissions) {
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);
    const isAdmin = permissions.includes("ALL") || permissions.includes("HABITS_MANAGE");
    if (habit.user_id !== userId && !isAdmin) throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);
    await Habits.updateOne({ _id: id }, { $set: { statut: "archived", date_archivage: new Date() } });
  }

  static async deleteHabitCascade(id, userId, permissions) {
    // ─ 1. Verify existence — no writes before this point ─────────────────────
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);

    // ─ 2. Verify ownership/admin — no writes before this point ───────────────
    // Only ALL (admin) can delete another user's habit.
    // HABITS_MANAGE is intentionally excluded: it governs the user's own habits.
    const isAdmin = permissions.includes("ALL") || permissions.includes("HABITS_MANAGE");
    if (habit.user_id !== userId && !isAdmin)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    // ─ 3. Cascade: children first, parent LAST ────────────────────────────────
    // MongoDB standalone — no transactions. Strategy: if a child step fails,
    // abort immediately and preserve the parent. If the parent fails after all
    // children are deleted, log a warn and surface a HABIT-005 error.
    const counts = { logs: 0, stats: 0, notes: 0, reminders: 0 };

    const STEPS = [
      { name: "habit_logs",           run: () => HabitLogs.deleteMany({ habit_id: id }),          key: "logs" },
      { name: "habit_stats",          run: () => HabitStats.deleteMany({ habit_id: id }),         key: "stats" },
      { name: "habit_note_histories", run: () => HabitNoteHistories.deleteMany({ habit_id: id }), key: "notes" },
      { name: "reminders",            run: () => Reminders.deleteMany({ habit_id: id }),           key: "reminders" },
    ];

    for (const step of STEPS) {
      try {
        const result = await step.run();
        counts[step.key] = result.deletedCount ?? 0;
      } catch (err) {
        logger.warn(
          { action: "habit-cascade-delete", step: step.name, habitId: id, userId, progress: counts, error: err.message },
          "Cascade partial failure — habit document preserved"
        );
        const cascadeErr = new AppError(
          `${ErrorMessages[ErrorsCodes.CASCADE_PARTIAL]} (stopped at "${step.name}": ${err.message})`,
          500,
          ErrorsCodes.CASCADE_PARTIAL
        );
        cascadeErr.partial = { deleted: { habit: 0, ...counts }, failed_at: step.name };
        throw cascadeErr;
      }
    }

    // ─ 4. Delete parent document — all children already purged ───────────────
    try {
      await Habits.deleteOne({ _id: id });
    } catch (err) {
      logger.warn(
        { action: "habit-cascade-delete", step: "habits", habitId: id, userId, progress: counts, error: err.message },
        "Cascade partial failure — children deleted but parent document survived"
      );
      const cascadeErr = new AppError(
        `${ErrorMessages[ErrorsCodes.CASCADE_PARTIAL]} (children deleted, parent deletion failed: ${err.message})`,
        500,
        ErrorsCodes.CASCADE_PARTIAL
      );
      cascadeErr.partial = { deleted: { habit: 0, ...counts }, failed_at: "habits" };
      throw cascadeErr;
    }

    // ─ 5. Audit log + return ──────────────────────────────────────────────────
    logger.info(
      { action: "habit-cascade-delete", habitId: id, userId, counts },
      "Habit and all related data permanently deleted"
    );
    return { deleted: { habit: 1, ...counts } };
  }

  // Backward-compat wrapper — callers using the old name continue to work.
  static async deleteHabit(id, userId, permissions) {
    return HabitsService.deleteHabitCascade(id, userId, permissions);
  }

}

export default HabitsService;
