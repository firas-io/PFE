const Habit = require("../models/Habit");
const HabitTemplate = require("../models/HabitTemplate");

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
    archivee: "archived",
    archiver: "archived"
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

  function normalizeStatus(input) {
    if (input === undefined || input === null) return undefined;
    return statusMap[normalizeKey(input)] || undefined;
  }

  function normalizePriorite(input) {
    if (input === undefined || input === null) return undefined;
    return prioriteMap[normalizeKey(input)] || undefined;
  }

  function normalizeCategorie(input) {
    if (input === undefined || input === null) return undefined;
    return categorieMap[normalizeKey(input)] || undefined;
  }

  function normalizeFrequence(input, body) {
    let mode;
    if (typeof input === "string") mode = freqMap[normalizeKey(input)] || undefined;
    if (!mode) {
      const maybe = body?.frequence_mode ?? body?.frequenceMode ?? body?.frequenceType;
      if (typeof maybe === "string") mode = freqMap[normalizeKey(maybe)] || undefined;
    }
    if (!mode) {
      const hasSpecificDays = body?.jours_specifiques ?? body?.joursSpecifiques;
      const hasTimesPerWeek = body?.fois_par_semaine ?? body?.foisParSemaine;
      if (hasSpecificDays) mode = "specific_days";
      if (hasTimesPerWeek) mode = "times_per_week";
    }
    return mode;
  }

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
    if (
      body.objectif_valeur !== undefined ||
      body.objectif_unite !== undefined ||
      body.objectif_detail !== undefined
    ) {
      const objectif_valeur = body.objectif_valeur !== undefined ? Number(body.objectif_valeur) : undefined;
      return {
        objectif_valeur: objectif_valeur !== undefined && Number.isFinite(objectif_valeur) ? objectif_valeur : undefined,
        objectif_unite: body.objectif_unite,
        objectif_detail: body.objectif_detail
      };
    }

    const raw = body.objectif_quantifiable ?? body.objectif;
    if (!raw || typeof raw !== "string") return {};

    const parsed = parseObjectifString(raw);
    if (!parsed) return {};
    return {
      objectif_valeur: parsed.valeur,
      objectif_unite: parsed.unite,
      objectif_detail: parsed.detail
    };
  }

  // GET /habits/templates — Bibliothèque de templates
  fastify.get("/habits/templates", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const templates = await HabitTemplate.find();
      return templates;
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // POST /habits/from-template/:templateId — Création depuis un template
  fastify.post("/habits/from-template/:templateId", { preHandler: [fastify.authenticate] }, async (req, reply) => {
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
  });
}

module.exports = routes;

