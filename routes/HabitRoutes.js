const Habit = require("../models/Habit");
const HabitNoteHistory = require("../models/HabitNoteHistory");

async function routes(fastify) {
  function canSetVisiblePourTous(req) {
    const p = req.user.permissions || [];
    return p.includes("HABITS_MANAGE") || p.includes("HABITS_VIEW") || p.includes("ALL");
  }

  function parseVisiblePourTous(body) {
    const v = body?.visible_pour_tous ?? body?.visiblePourTous;
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    return undefined;
  }

  function stripAccents(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeKey(value) {
    return stripAccents(value)
      .toLowerCase()
      .trim()
      .replace(/[\s\-]+/g, "_")
      .replace(/_+/g, "_");
  }

  const categorieMap = {
    sante: "sante",
    sante_categorie: "sante",
    travail: "travail",
    apprentissage: "apprentissage",
    bien_etre: "bien_etre",
    sport: "sport",
    autre: "autre"
  };

  const prioriteMap = {
    haute: "high",
    high: "high",
    moyenne: "medium",
    medium: "medium",
    basse: "low",
    low: "low"
  };

  const statusMap = {
    active: "active",
    actif: "active",
    pause: "pause",
    en_pause: "pause",
    archived: "archived",
    archiver: "archived",
    archivee: "archived"
  };

  const freqMap = {
    daily: "daily",
    quotidienne: "daily",
    hebdomadaire: "weekly",
    weekly: "weekly",
    monthly: "monthly",
    mensuelle: "monthly",
    mensuel: "monthly",
    specific_days: "specific_days",
    jours_specifiques: "specific_days",
    times_per_week: "times_per_week",
    fois_par_semaine: "times_per_week",
    x_fois_par_semaine: "times_per_week"
  };

  const weekDayMap = {
    lundi: "lundi",
    mon: "lundi",
    mardi: "mardi",
    tue: "mardi",
    mercredi: "mercredi",
    wed: "mercredi",
    jeudi: "jeudi",
    thu: "jeudi",
    vendredi: "vendredi",
    fri: "vendredi",
    samedi: "samedi",
    sat: "samedi",
    dimanche: "dimanche",
    sun: "dimanche"
  };

  const horairesMap = {
    matin: "matin",
    midi: "midi",
    soir: "soir"
  };

  function normalizeWeekDays(value) {
    if (value === undefined || value === null) return undefined;
    const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
    const normalized = list
      .map((v) => (typeof v === "string" ? normalizeKey(v) : v))
      .map((v) => weekDayMap[v] || v)
      .filter(Boolean);
    return normalized.length ? normalized : undefined;
  }

  function normalizeHorairesCibles(value) {
    if (value === undefined || value === null) return undefined;
    const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
    const normalized = list
      .map((v) => (typeof v === "string" ? normalizeKey(v) : v))
      .map((v) => horairesMap[v] || v)
      .filter(Boolean);
    return normalized.length ? normalized : undefined;
  }

  function normalizeStatus(input) {
    if (input === undefined || input === null) return undefined;
    const key = normalizeKey(input);
    return statusMap[key] || undefined;
  }

  function normalizePriorite(input) {
    if (input === undefined || input === null) return undefined;
    const key = normalizeKey(input);
    return prioriteMap[key] || undefined;
  }

  function normalizeCategorie(input) {
    if (input === undefined || input === null) return undefined;
    const key = normalizeKey(input);
    return categorieMap[key] || undefined;
  }

  function normalizeFrequence(input, body) {
    let mode;
    if (typeof input === "string") {
      mode = freqMap[normalizeKey(input)] || undefined;
    }

    if (!mode) {
      const maybe = body?.frequence_mode ?? body?.frequenceMode ?? body?.frequenceType;
      if (typeof maybe === "string") mode = freqMap[normalizeKey(maybe)] || undefined;
    }

    // fallback : infer from details presence
    if (!mode) {
      const hasSpecificDays = body?.jours_specifiques ?? body?.joursSpecifiques;
      const hasTimesPerWeek = body?.fois_par_semaine ?? body?.foisParSemaine;
      if (hasSpecificDays) mode = "specific_days";
      if (hasTimesPerWeek) mode = "times_per_week";
    }

    return mode;
  }

  function normalizeHeurePrecise(input) {
    if (input === undefined || input === null) return undefined;
    return String(input).trim();
  }

  function parseObjectifString(s) {
    const str = String(s).trim();
    const lower = stripAccents(str).toLowerCase();

    const numMatch = lower.match(/(\d[\d\s.,]*)/);
    if (!numMatch) return undefined;

    const rawNumber = numMatch[1].replace(/\s+/g, "").replace(",", ".");
    const valeur = Number(rawNumber);
    if (!Number.isFinite(valeur)) return undefined;

    const unitCandidate = lower.slice(numMatch.index + numMatch[0].length).trim();
    if (!unitCandidate) return { valeur, unite: undefined, detail: str };

    let unite = unitCandidate;
    if (unite.includes("minute")) unite = "minutes";
    else if (unite.includes("pas")) unite = "pas";
    else if (unite.includes("heure")) unite = "heures";

    return { valeur, unite, detail: str };
  }

  function normalizeObjectif(body) {
    // Format canonique (storage)
    if (
      body.objectif_valeur !== undefined ||
      body.objectif_unite !== undefined ||
      body.objectif_detail !== undefined
    ) {
      const out = {};

      if (body.objectif_valeur !== undefined) {
        const objectif_valeur = Number(body.objectif_valeur);
        if (Number.isFinite(objectif_valeur)) out.objectif_valeur = objectif_valeur;
      }
      if (body.objectif_unite !== undefined) out.objectif_unite = body.objectif_unite;
      if (body.objectif_detail !== undefined) out.objectif_detail = body.objectif_detail;

      return out;
    }

    const raw = body.objectif_quantifiable ?? body.objectif;
    if (!raw || typeof raw !== "string") return {};

    const parsed = parseObjectifString(raw);
    if (!parsed) return {};

    const out = { objectif_valeur: parsed.valeur, objectif_detail: parsed.detail };
    if (parsed.unite !== undefined) out.objectif_unite = parsed.unite;
    return out;
  }

  function normalizeHabitPayload(body, { requireNom = false } = {}) {
    const payload = {};

    const nom = body.nom ?? body.titre;
    if (nom !== undefined) payload.nom = String(nom).trim();
    if (requireNom && (!payload.nom || !payload.nom.length)) return null;

    if (body.description !== undefined) payload.description = body.description;

    if (body.note !== undefined) payload.note = body.note;

    if (body.date_debut !== undefined && body.date_debut) {
      payload.date_debut = new Date(body.date_debut);
    }

    // Handle dates_specifiques
    if (body.dates_specifiques !== undefined && Array.isArray(body.dates_specifiques)) {
      console.log("[DATES_SPEC] Received array:", body.dates_specifiques);
      const converted = body.dates_specifiques.map(d => {
        const dateObj = new Date(d);
        console.log(`[DATES_SPEC] Converting "${d}" to ${dateObj.toISOString()}`);
        return dateObj;
      });
      payload.dates_specifiques = converted;
      console.log("[DATES_SPEC] Final payload dates:", payload.dates_specifiques);
    } else {
      console.log("[DATES_SPEC] No dates_specifiques in body or not an array. Body:", body.dates_specifiques);
    }

    const categorie = normalizeCategorie(body.categorie);
    if (categorie !== undefined) payload.categorie = categorie;

    const statut = normalizeStatus(body.statut ?? body.status);
    if (statut !== undefined) {
      payload.statut = statut;
      if (statut === "archived") payload.date_archivage = body.date_archivage ?? new Date();
    }

    const priorite = normalizePriorite(body.priorite ?? body.priority);
    if (priorite !== undefined) payload.priorite = priorite;

    const frequence = normalizeFrequence(body.frequence, body);
    if (frequence !== undefined) payload.frequence = frequence;

    const jours = normalizeWeekDays(body.jours_specifiques ?? body.joursSpecifiques);
    if (jours) payload.jours_specifiques = jours;

    const fois = body.fois_par_semaine ?? body.foisParSemaine;
    if (fois !== undefined) payload.fois_par_semaine = Number(fois);

    const horaires = normalizeHorairesCibles(body.horaires_cibles ?? body.horairesCibles ?? body.horaires);
    if (horaires) payload.horaires_cibles = horaires;

    const heure_precise = normalizeHeurePrecise(body.heure_precise ?? body.heurePrecise);
    if (heure_precise !== undefined) payload.heure_precise = heure_precise;

    Object.assign(payload, normalizeObjectif(body));

    return payload;
  }

  // POST /habits — Authentifié
  fastify.post(
    "/habits",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
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
    }
  );

  // GET /habits — RÉSERVÉ AUX ADMINS (Permission: HABITS_VIEW)
  fastify.get(
    "/habits",
    {
      preHandler: [fastify.authenticate, fastify.authorize(["HABITS_VIEW"])]
    },
    async (req, reply) => {
      try {
        const status = normalizeStatus(req.query?.statut ?? req.query?.status);
        const query = status ? { statut: status } : {};
        const habits = await Habit.find(query).populate("utilisateur_id", "-mot_de_passe");
        return habits;
      } catch (err) {
        reply.code(500);
        return { error: err.message };
      }
    }
  );

  // GET /habits/:id — Propriétaire ou Admin (Permission: HABITS_VIEW)
  fastify.get(
    "/habits/:id",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
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
    }
  );

  // PUT /habits/:id — Propriétaire ou Admin (Permission: HABITS_MANAGE)
  fastify.put(
    "/habits/:id",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
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
    }
  );

  // PATCH /habits/:id/status — Statut (active, pause, archived)
  fastify.patch(
    "/habits/:id/status",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
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
    }
  );

  // PATCH /habits/:id/notes — Ajouter/modifier les notes (accessible à tous les utilisateurs)
  fastify.patch(
    "/habits/:id/notes",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
          reply.code(404);
          return { error: "Habit not found" };
        }

        // Vérifier que l'utilisateur peut accéder à cette habitude (propriétaire ou habitude partagée)
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
    }
  );

  // GET /habits/:id/notes/history — Récupérer l'historique des notes
  fastify.get(
    "/habits/:id/notes/history",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
          reply.code(404);
          return { error: "Habit not found" };
        }

        // Vérifier que l'utilisateur peut accéder à cette habitude
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
    }
  );

  // POST /habits/:id/clone — Clonage d'habitude
  fastify.post(
    "/habits/:id/clone",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
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
    }
  );

  // DELETE /habits/:id — Archivage (soft delete)
  fastify.delete(
    "/habits/:id",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
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
    }
  );

  // DELETE /habits/:id/hard — Suppression physique
  fastify.delete(
    "/habits/:id/hard",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
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
    }
  );

  // GET /habits/my — Voir ses propres habitudes (par défaut: active/pause)
  fastify.get(
    "/habits/my",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
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
    }
  );

  // GET /habits/admin/notes/all — Admin: Voir tous les notes du système
  fastify.get(
    "/habits/admin/notes/all",
    { preHandler: [fastify.authenticate, fastify.authorize(["HABITS_MANAGE", "ALL"])] },
    async (req, reply) => {
      try {
        const page = parseInt(req.query?.page) || 1;
        const limit = parseInt(req.query?.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query?.search || "";

        // Build search query
        const searchQuery = search ? {
          $or: [
            { note_text: { $regex: search, $options: "i" } },
          ]
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
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      } catch (err) {
        reply.code(500);
        return { error: err.message };
      }
    }
  );

  // GET /habits/admin/notes/by-habit/:habitId — Admin: Voir l'historique d'une habitude
  fastify.get(
    "/habits/admin/notes/by-habit/:habitId",
    { preHandler: [fastify.authenticate, fastify.authorize(["HABITS_MANAGE", "ALL"])] },
    async (req, reply) => {
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
    }
  );

  // GET /habits/admin/notes/by-user/:userId — Admin: Voir les notes d'un utilisateur
  fastify.get(
    "/habits/admin/notes/by-user/:userId",
    { preHandler: [fastify.authenticate, fastify.authorize(["HABITS_MANAGE", "ALL"])] },
    async (req, reply) => {
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
    }
  );
}

module.exports = routes;
