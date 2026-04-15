/**
 * habit.controller.js
 * Business logic for habit CRUD, status changes, notes, cloning, and admin note views.
 * Extracted from HabitRoutes.js — all normalization helpers live in utils/habitNormalize.js.
 */
const Habit = require("../models/Habit");
const HabitNoteHistory = require("../models/HabitNoteHistory");
const {
  normalizeHabitPayload,
  normalizeStatus,
  canSetVisiblePourTous,
  parseVisiblePourTous
} = require("../utils/habitNormalize");

// POST /habits — Authenticated
exports.createHabit = async (req, reply) => {
  try {
    const habitPayload = normalizeHabitPayload(req.body, { requireNom: true });
    if (!habitPayload) {
      reply.code(400);
      return { error: "nom/titre is required" };
    }

    console.log("[CREATE HABIT] Payload ready:", {
      nom: habitPayload.nom,
      dates_specifiques: habitPayload.dates_specifiques
    });

    let visible_pour_tous = false;
    const wantVisible = parseVisiblePourTous(req.body);
    if (wantVisible === true && canSetVisiblePourTous(req)) visible_pour_tous = true;

    const habit = await Habit.create({
      ...habitPayload,
      utilisateur_id: req.user.id,
      visible_pour_tous
    });

    console.log("[CREATE HABIT] Saved to DB:", {
      _id: habit._id,
      nom: habit.nom,
      dates_specifiques: habit.dates_specifiques
    });

    reply.code(201);
    return habit;
  } catch (err) {
    console.error("[CREATE HABIT] Error:", err.message);
    reply.code(400);
    return { error: err.message };
  }
};

// GET /habits — Admin only (Permission: HABITS_VIEW)
exports.getAllHabits = async (req, reply) => {
  try {
    const status = normalizeStatus(req.query?.statut ?? req.query?.status);
    const query = status ? { statut: status } : {};
    const habits = await Habit.find(query).populate("utilisateur_id", "-mot_de_passe");
    return habits;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /habits/my — Current user's habits (active/pause by default)
exports.getMyHabits = async (req, reply) => {
  try {
    const status = normalizeStatus(req.query?.statut ?? req.query?.status);
    const includeArchived = req.query?.includeArchived === "true" || req.query?.includeArchived === true;

    const statusClause = status
      ? { statut: status }
      : !includeArchived
        ? {
            $or: [
              { statut: { $in: ["active", "pause"] } },
              { statut: { $exists: false } },
              { statut: null }
            ]
          }
        : {};

    const ownHabits = { utilisateur_id: req.user.id, ...statusClause };
    const sharedHabits = { visible_pour_tous: true, ...statusClause };
    const query = { $or: [ownHabits, sharedHabits] };

    const habits = await Habit.find(query);
    return habits;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /habits/:id — Owner or Admin (Permission: HABITS_VIEW)
exports.getHabitById = async (req, reply) => {
  try {
    const habit = await Habit.findById(req.params.id).populate("utilisateur_id", "-mot_de_passe");
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    const isAdmin = req.user.permissions.includes("HABITS_VIEW") || req.user.permissions.includes("ALL");
    const habitOwnerId = habit.utilisateur_id._id.toString();
    const canReadShared = habit.visible_pour_tous === true;
    if (habitOwnerId !== req.user.id && !isAdmin && !canReadShared) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    return habit;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// PUT /habits/:id — Owner or Admin (Permission: HABITS_MANAGE)
exports.updateHabit = async (req, reply) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    const isAdmin = req.user.permissions.includes("HABITS_MANAGE") || req.user.permissions.includes("ALL");
    if (habit.utilisateur_id.toString() !== req.user.id && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const habitPayload = normalizeHabitPayload(req.body, { requireNom: false });
    const wantVisible = parseVisiblePourTous(req.body);
    if (wantVisible !== undefined && canSetVisiblePourTous(req)) {
      habitPayload.visible_pour_tous = wantVisible;
    }

    const updatedHabit = await Habit.findByIdAndUpdate(req.params.id, habitPayload, { new: true });
    return updatedHabit;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// PATCH /habits/:id/status — Update habit status (active, pause, archived)
exports.updateHabitStatus = async (req, reply) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    const habitUserId = habit.utilisateur_id?.toString();
    const reqUserId = req.user.id?.toString();
    const userPermissions = req.user.permissions || [];
    const isAdmin = userPermissions.includes("HABITS_MANAGE") || userPermissions.includes("ALL");

    console.log(`[STATUS UPDATE] Habit ID: ${req.params.id}`);
    console.log(`[STATUS UPDATE] Habit utilisateur_id: ${habitUserId} (type: ${typeof habitUserId})`);
    console.log(`[STATUS UPDATE] User ID: ${reqUserId} (type: ${typeof reqUserId})`);
    console.log(`[STATUS UPDATE] IDs match: ${habitUserId === reqUserId}`);
    console.log(`[STATUS UPDATE] User permissions: ${JSON.stringify(userPermissions)}`);
    console.log(`[STATUS UPDATE] Is Admin: ${isAdmin}`);

    if (habitUserId !== reqUserId && !isAdmin) {
      console.log(`[STATUS UPDATE] Access DENIED - Habit owner: ${habitUserId}, User: ${reqUserId}, Admin: ${isAdmin}`);
      reply.code(403);
      return {
        error: "Accès refusé",
        debug: { habitUserId, reqUserId, isAdmin, habitExists: !!habit, userPermissions }
      };
    }

    const statut = normalizeStatus(req.body?.statut ?? req.body?.status);
    if (!statut) {
      reply.code(400);
      return { error: "statut/status is required (active|pause|archived)" };
    }

    if (statut === "archived") {
      const result = await Habit.findByIdAndUpdate(
        req.params.id,
        { statut, date_archivage: new Date() },
        { new: true }
      );
      console.log(`[STATUS UPDATE] Successfully archived habit ${req.params.id}`);
      return result;
    }

    const result = await Habit.findByIdAndUpdate(
      req.params.id,
      { $set: { statut }, $unset: { date_archivage: "" } },
      { new: true }
    );
    console.log(`[STATUS UPDATE] Successfully updated habit ${req.params.id} to ${statut}`);
    return result;
  } catch (err) {
    console.error(`[STATUS UPDATE] Error:`, err);
    reply.code(400);
    return { error: err.message };
  }
};

// PATCH /habits/:id/notes — Add/update notes (owner or shared habit)
exports.updateHabitNotes = async (req, reply) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    const isOwner = habit.utilisateur_id.toString() === req.user.id;
    const isShared = habit.visible_pour_tous === true;

    if (!isOwner && !isShared) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const newNote = req.body?.note !== undefined ? req.body.note : undefined;
    const oldNote = habit.note || null;

    // Create history entry if note changed
    if (oldNote !== newNote) {
      await HabitNoteHistory.create({
        habit_id: req.params.id,
        utilisateur_id: req.user.id,
        old_note: oldNote,
        new_note: newNote,
        action: oldNote ? "updated" : "created",
        note_text: newNote,
      });
    }

    const updatedHabit = await Habit.findByIdAndUpdate(
      req.params.id,
      { $set: { note: newNote } },
      { new: true }
    );

    return updatedHabit;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// GET /habits/:id/notes/history — Note history for a habit
exports.getNoteHistory = async (req, reply) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    const isOwner = habit.utilisateur_id.toString() === req.user.id;
    const isAdmin = req.user.permissions.includes("HABITS_MANAGE") || req.user.permissions.includes("ALL");
    const isShared = habit.visible_pour_tous === true;

    if (!isOwner && !isAdmin && !isShared) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const history = await HabitNoteHistory.find({ habit_id: req.params.id })
      .populate("utilisateur_id", "prenom nom email")
      .sort({ createdAt: -1 });

    return history;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// POST /habits/:id/clone — Clone a habit
exports.cloneHabit = async (req, reply) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    const isAdmin = req.user.permissions.includes("HABITS_MANAGE") || req.user.permissions.includes("ALL");
    const canCloneShared = habit.visible_pour_tous === true;
    if (habit.utilisateur_id.toString() !== req.user.id && !isAdmin && !canCloneShared) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const bodyPayload = normalizeHabitPayload(req.body ?? {}, { requireNom: false }) || {};
    const statut = normalizeStatus(req.body?.statut ?? req.body?.status) || "active";

    const cloneName = bodyPayload.nom || `${habit.nom} (copie)`;
    const clonedHabit = await Habit.create({
      utilisateur_id: req.user.id,
      nom: cloneName,
      description: bodyPayload.description ?? habit.description,
      categorie: bodyPayload.categorie ?? habit.categorie,
      frequence: bodyPayload.frequence ?? habit.frequence,
      jours_specifiques: bodyPayload.jours_specifiques ?? habit.jours_specifiques,
      fois_par_semaine: bodyPayload.fois_par_semaine ?? habit.fois_par_semaine,
      horaires_cibles: bodyPayload.horaires_cibles ?? habit.horaires_cibles,
      heure_precise: bodyPayload.heure_precise ?? habit.heure_precise,
      priorite: bodyPayload.priorite ?? habit.priorite,
      objectif_valeur: bodyPayload.objectif_valeur ?? habit.objectif_valeur,
      objectif_unite: bodyPayload.objectif_unite ?? habit.objectif_unite,
      objectif_detail: bodyPayload.objectif_detail ?? habit.objectif_detail,
      statut,
      date_archivage: statut === "archived" ? new Date() : undefined
    });

    reply.code(201);
    return clonedHabit;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// DELETE /habits/:id — Soft delete (archive)
exports.archiveHabit = async (req, reply) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    const isAdmin = req.user.permissions.includes("HABITS_MANAGE") || req.user.permissions.includes("ALL");
    if (habit.utilisateur_id.toString() !== req.user.id && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    await Habit.findByIdAndUpdate(req.params.id, { statut: "archived", date_archivage: new Date() });
    reply.code(204);
    return null;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// DELETE /habits/:id/hard — Hard delete
exports.deleteHabit = async (req, reply) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      reply.code(404);
      return { error: "Habit not found" };
    }

    const isAdmin = req.user.permissions.includes("HABITS_MANAGE") || req.user.permissions.includes("ALL");
    if (habit.utilisateur_id.toString() !== req.user.id && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    await Habit.findByIdAndDelete(req.params.id);
    reply.code(204);
    return null;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// ─── Admin Note Views ─────────────────────────────────────────────────────────

// GET /habits/admin/notes/all — Admin: view all notes in the system
exports.adminGetAllNotes = async (req, reply) => {
  try {
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query?.search || "";

    const searchQuery = search ? {
      $or: [{ note_text: { $regex: search, $options: "i" } }]
    } : {};

    const history = await HabitNoteHistory.find(searchQuery)
      .populate("utilisateur_id", "prenom nom email")
      .populate("habit_id", "nom categorie")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HabitNoteHistory.countDocuments(searchQuery);

    return {
      data: history,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /habits/admin/notes/by-habit/:habitId — Admin: note history for one habit
exports.adminGetNotesByHabit = async (req, reply) => {
  try {
    const history = await HabitNoteHistory.find({ habit_id: req.params.habitId })
      .populate("utilisateur_id", "prenom nom email")
      .populate("habit_id", "nom categorie utilisateur_id")
      .sort({ createdAt: -1 });

    return history;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /habits/admin/notes/by-user/:userId — Admin: notes by a specific user
exports.adminGetNotesByUser = async (req, reply) => {
  try {
    const history = await HabitNoteHistory.find({ utilisateur_id: req.params.userId })
      .populate("utilisateur_id", "prenom nom email")
      .populate("habit_id", "nom categorie")
      .sort({ createdAt: -1 });

    return history;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};
