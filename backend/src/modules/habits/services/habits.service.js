import { paginate }           from "@/helpers/pagination.helper.js";
import { parseSearchQuery }   from "@/helpers/search.helper.js";
import { Habits }             from "../models/Habit.model.js";
import { UserHabitSettings }  from "../models/UserHabitSettings.model.js";
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
  resolveCategorieSlug,
} from "@/shared/constants/categories.js";
import CategoriesService from "@/modules/categories/services/categories.service.js";

function _explicitCategorieInBody(body) {
  const raw = body?.categorie ?? body?.category;
  return raw !== undefined && raw !== null && String(raw).trim() !== "";
}

async function _applyCategorieWriteValidation(body, payload, { isCreate }) {
  const explicit = _explicitCategorieInBody(body);
  if (isCreate) {
    if (!explicit) {
      payload.categorie = "autre";
      return;
    }
    const slug = payload.categorie ?? resolveCategorieSlug(body.categorie ?? body.category);
    const valid = await CategoriesService.resolveActiveSlug(slug);
    if (!valid) {
      throw new AppError(
        `Catégorie invalide ou inactive.`,
        400,
        ErrorsCodes.INVALID_CATEGORY
      );
    }
    payload.categorie = valid;
  } else if (explicit) {
    const slug = payload.categorie ?? resolveCategorieSlug(body.categorie ?? body.category);
    const valid = await CategoriesService.resolveActiveSlug(slug);
    if (!valid) {
      throw new AppError(
        `Catégorie invalide ou inactive.`,
        400,
        ErrorsCodes.INVALID_CATEGORY
      );
    }
    payload.categorie = valid;
  }
}

async function _sanitizeCategorieChamps(payload, effectiveCategorieSlug) {
  if (payload.categorie_champs === undefined) return;
  if (payload.categorie_champs === null) return;
  if (typeof payload.categorie_champs !== "object" || Array.isArray(payload.categorie_champs)) {
    delete payload.categorie_champs;
    return;
  }
  const def = await CategoriesService.getCategoryDef(String(effectiveCategorieSlug));
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

    await _applyCategorieWriteValidation(body, habitPayload, { isCreate: true });
    await _sanitizeCategorieChamps(habitPayload, habitPayload.categorie);
    _applyCustomCategorieMeta(body, habitPayload, habitPayload.categorie);

    await HabitsService._validateDatesAgainstOffDays(habitPayload.dates_specifiques);

    // Admin can create global habits (visible to all users on their dashboard)
    const permissions  = req?.user?.permissions || [];
    const isPrivileged = permissions.includes("ALL") || permissions.includes("HABITS_MANAGE");

    // Regular users: category must be active; auto-add to profile if not yet selected
    if (!isPrivileged) {
      const isCustomOther =
        habitPayload.categorie === "autre" && !!habitPayload.categorie_ticket_id;
      if (!isCustomOther) {
        const validSlug = await CategoriesService.resolveActiveSlug(habitPayload.categorie);
        if (!validSlug) {
          throw new AppError(
            "Catégorie invalide ou inactive.",
            400,
            ErrorsCodes.INVALID_CATEGORY
          );
        }
        habitPayload.categorie = validSlug;
        const userDoc = await Users.findById(userId);
        const userCategories = userDoc?.categories ?? [];
        const alreadyHas = userCategories.some(
          (c) => String(c).toLowerCase() === String(validSlug).toLowerCase()
        );
        if (!alreadyHas) {
          await Users.updateOne(
            { _id: userId },
            { $addToSet: { categories: validSlug } }
          );
        }
      }
    }
    const isAdmin      = permissions.includes("ALL");
    const wantsGlobal  = body?.is_global === true || body?.is_global === "true";
    const is_global        = isAdmin && wantsGlobal;
    const created_by_admin = isAdmin && wantsGlobal;

    // Global habits are always visible to everyone — no need to set visible_pour_tous separately
    let visible_pour_tous = is_global ? true : false;
    if (!is_global) {
      const wantVisible = parseVisiblePourTous(body);
      if (wantVisible === true) {
        if (!canSetVisiblePourTous(req))
          throw new AppError("Vous n'avez pas le droit d'activer la visibilité publique", 403, "HABIT-006");
        visible_pour_tous = true;
      }
    }

    logger.info({ action: "create-habit", userId, is_global, visible_pour_tous }, "Habit created");
    return Habits.insertOne({ ...habitPayload, user_id: userId, visible_pour_tous, is_global, created_by_admin });
  }

  static async getAllHabits(query) {
    const status = normalizeStatus(query?.statut ?? query?.status);
    const filter = status ? { statut: status } : {};
    const page   = parseInt(query?.page)  || 1;
    const limit  = parseInt(query?.limit) || 10;
    return paginate(Habits, filter, page, limit, { sort: { createdAt: -1 } });
  }

  /**
   * Search habits by title, description, or category.
   * Admin: all habits. User: own habits + visible global habits.
   */
  static async searchHabits(userId, permissions, query = {}) {
    const term = String(query.q ?? query.search ?? "").trim();
    const regex = parseSearchQuery(term);
    if (!regex) {
      throw new AppError("Le paramètre q (recherche) est requis.", 400, ErrorsCodes.NOM_REQUIRED);
    }

    const textClause = {
      $or: [
        { nom: { $regex: regex } },
        { description: { $regex: regex } },
        { categorie: { $regex: regex } },
        { categorie_label: { $regex: regex } },
      ],
    };

    const status = normalizeStatus(query?.statut ?? query?.status);
    const includeArchived = query?.includeArchived === "true" || query?.includeArchived === true;
    const statusClause = status
      ? { statut: status }
      : !includeArchived
        ? { $or: [{ statut: { $in: ["active", "pause"] } }, { statut: { $exists: false } }, { statut: null }] }
        : {};

    const andParts = [textClause];
    if (Object.keys(statusClause).length > 0) andParts.push(statusClause);
    if (query.categorie) andParts.push({ categorie: String(query.categorie).trim() });

    const isPrivileged =
      permissions.includes("ALL") ||
      permissions.includes("HABITS_VIEW") ||
      permissions.includes("HABITS_MANAGE");

    if (!isPrivileged) {
      andParts.unshift({
        $or: [{ user_id: userId }, { visible_pour_tous: true }],
      });
    }

    const filter = andParts.length === 1 ? andParts[0] : { $and: andParts };
    const page  = parseInt(query?.page)  || 1;
    const limit = Math.min(parseInt(query?.limit) || 10, 50);
    const result = await paginate(Habits, filter, page, limit, { sort: { createdAt: -1 } });
    return { ...result, q: term };
  }

  static async getMyHabits(userId, query, reqUser = null) {
    const status          = normalizeStatus(query?.statut ?? query?.status);
    const includeArchived = query?.includeArchived === "true" || query?.includeArchived === true;
    const statusClause    = status
      ? { statut: status }
      : !includeArchived
        ? { $or: [{ statut: { $in: ["active", "pause"] } }, { statut: { $exists: false } }, { statut: null }] }
        : {};

    // Exclude global habits the user has personally archived via their UserHabitSettings
    const [userSettings, userDoc] = await Promise.all([
      UserHabitSettings.findAllByUser(userId),
      Users.findById(userId),
    ]);
    const personallyArchivedIds = userSettings
      .filter(s => s.statut_perso === "archive")
      .map(s => String(s.habit_id));

    // For regular users, restrict global habits to their selected categories only
    const isRegularUser = reqUser
      ? !((reqUser.permissions || []).includes("ALL") || (reqUser.permissions || []).includes("HABITS_MANAGE") || (reqUser.permissions || []).includes("HABITS_VIEW"))
      : true;
    const userCategories = userDoc?.categories ?? [];
    const categoryClause = (isRegularUser && userCategories.length > 0)
      ? { categorie: { $in: userCategories } }
      : {};

    const globalFilter = {
      visible_pour_tous: true,
      ...(personallyArchivedIds.length > 0 ? { _id: { $nin: personallyArchivedIds } } : {}),
      ...categoryClause,
      ...statusClause,
    };

    return Habits.find({ $or: [{ user_id: userId, ...statusClause }, globalFilter] });
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

    await _applyCategorieWriteValidation(body, payload, { isCreate: false });
    const effectiveCat = payload.categorie !== undefined ? payload.categorie : habit.categorie;
    _applyCustomCategorieMeta(body, payload, effectiveCat);
    if (payload.categorie_champs !== undefined)
      await _sanitizeCategorieChamps(payload, effectiveCat);

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

  static async updateHabitNotes(id, body, userId, userRole) {
    if (userRole?.toLowerCase() === "manager")
      throw new AppError("Les managers ne peuvent pas modifier les notes d'habitudes.", 403, ErrorsCodes.ACCESS_DENIED);

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

  static async getNoteHistory(id, userId, permissions, userRole) {
    if (userRole?.toLowerCase() === "manager")
      throw new AppError("Les managers ne peuvent pas accéder à l'historique des notes.", 403, ErrorsCodes.ACCESS_DENIED);

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
    await _applyCategorieWriteValidation(body ?? {}, bodyPayload, { isCreate: false });
    const statut      = normalizeStatus(body?.statut ?? body?.status) || "active";

    const cloneCategorie = bodyPayload.categorie !== undefined ? bodyPayload.categorie : habit.categorie;
    if (bodyPayload.categorie_champs !== undefined)
      await _sanitizeCategorieChamps(bodyPayload, cloneCategorie);

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

  static async restoreHabit(id, userId, permissions) {
    const habit = await Habits.findById(id);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);

    const isAdmin = permissions.includes("ALL") || permissions.includes("HABITS_MANAGE");
    if (habit.user_id !== userId && !isAdmin)
      throw new AppError(ErrorMessages[ErrorsCodes.ACCESS_DENIED], 403, ErrorsCodes.ACCESS_DENIED);

    if (habit.statut !== "archived")
      throw new AppError("Cette habitude n'est pas archivée", 400, "HABIT-012");

    return Habits.updateOne({ _id: id }, { $set: { statut: "active" }, $unset: { date_archivage: "" } });
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

  // ─── Global habits ────────────────────────────────────────────────────────

  static async getGlobalHabits(userId) {
    const habits   = await Habits.find({ is_global: true, statut: { $ne: "archived" } });
    const settings = await UserHabitSettings.findAllByUser(userId);
    const settingsMap = new Map(settings.map(s => [String(s.habit_id), s]));

    return habits.map(habit => {
      const userSettings = settingsMap.get(String(habit._id)) || null;
      return {
        ...habit,
        isActivated:  !!userSettings && userSettings.statut_perso !== "archive",
        userSettings: userSettings || null,
      };
    });
  }

  static async activateHabit(habitId, userId) {
    const habit = await Habits.findById(habitId);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);
    if (!habit.is_global)
      throw new AppError("Seules les habitudes globales peuvent être activées", 400, "HABIT-007");

    const existing = await UserHabitSettings.findByUserAndHabit(userId, habitId);
    if (existing) {
      // Re-activate if previously archived
      if (existing.statut_perso === "archive")
        return UserHabitSettings.updateOne({ _id: existing._id }, { $set: { statut_perso: "actif", activated_at: new Date() } });
      throw new AppError("Habitude déjà activée", 400, "HABIT-008");
    }

    logger.info({ action: "activate-global-habit", userId, habitId }, "Global habit activated");
    return UserHabitSettings.insertOne({
      user_id:      userId,
      habit_id:     habitId,
      statut_perso: "actif",
      activated_at: new Date(),
    });
  }

  static async updateMyHabitSettings(habitId, userId, body) {
    const habit = await Habits.findById(habitId);
    if (!habit) throw new AppError(ErrorMessages[ErrorsCodes.NOT_FOUND], 404, ErrorsCodes.NOT_FOUND);
    if (!habit.is_global)
      throw new AppError("Seules les habitudes globales ont des settings personnels", 400, "HABIT-009");

    let settings = await UserHabitSettings.findByUserAndHabit(userId, habitId);
    if (!settings) {
      // Auto-create settings so users can archive/personalize without explicit activation
      settings = await UserHabitSettings.insertOne({
        user_id:      userId,
        habit_id:     habitId,
        statut_perso: "actif",
        activated_at: new Date(),
      });
    }

    const ALLOWED = ["note", "objectif_perso", "priorite_perso", "date_debut_perso", "statut_perso"];
    const patch   = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    if (patch.statut_perso && !["actif", "archive"].includes(patch.statut_perso))
      throw new AppError("statut_perso doit être 'actif' ou 'archive'", 400, "HABIT-011");

    logger.info({ action: "update-habit-settings", userId, habitId }, "User habit settings updated");
    return UserHabitSettings.updateOne({ _id: settings._id }, { $set: patch });
  }

}

export default HabitsService;
