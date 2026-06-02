/**
 * HabitFlow — Seed 1 an de données réalistes
 *
 * Collections remplies :
 *   roles, categories, users, habits, habit-logs,
 *   user_habit_settings, user_category_preferences,
 *   habit-stats, onboardings
 *
 * Exécution (depuis backend/) :
 *   node --import ./src/loader.js src/fixtures/seed-full-year.js
 */

import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { MongoDBManager } from "../core/mongo.connect.js";
import { CATEGORIES } from "../shared/constants/categories.js";
import { SYSTEM_ARCHIVED_USER_ID } from "../modules/users/constants/users.constants.js";

const MONTHS_BACK = 12;
const PASSWORD_PLACEHOLDER = "LDAP_ONLY";

const SEASONAL_FACTOR = [
  1.20, 1.00, 1.05, 1.08, 1.05, 0.92,
  0.80, 0.78, 1.18, 1.00, 0.90, 0.85,
];

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES DE RÉFÉRENCE
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ROLES = [
  {
    nom: "admin",
    description: "Administrateur plateforme",
    permissions: [
      "ALL",
      "MANAGERS_MANAGE", "MANAGER_TEAM_VIEW", "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
      "ROLES_VIEW", "ROLES_MANAGE", "USERS_VIEW", "USERS_MANAGE",
      "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE", "LOGS_VIEW", "LOGS_MANAGE",
      "STATS_VIEW", "STATS_MANAGE", "ONBOARDING_VIEW", "ONBOARDING_MANAGE",
      "OFFDAYS_VIEW", "OFF_DAYS_MANAGE", "TICKETS_MANAGE",
      "CATEGORIES_VIEW", "CATEGORIES_MANAGE",
    ],
  },
  {
    nom: "manager",
    description: "Responsable d'équipe",
    permissions: [
      "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
      "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
      "LOGS_VIEW", "LOGS_MANAGE", "PROGRESS_VIEW",
      "ONBOARDING_VIEW", "OFFDAYS_VIEW", "STATS_VIEW",
    ],
  },
  {
    nom: "utilisateur",
    description: "Utilisateur standard",
    permissions: [
      "SELF_VIEW", "SELF_EDIT",
      "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
      "LOGS_VIEW", "LOGS_MANAGE", "PROGRESS_VIEW",
      "ONBOARDING_VIEW", "OFFDAYS_VIEW",
    ],
  },
];

const MANAGERS = [
  { email: "thomas.rousseau@habitflow.local", firstName: "Thomas", lastName: "Rousseau", department: "Bien-être & Performance", monthsAgo: 12, engagement: 0.78, improving: false },
  { email: "sarah.benali@habitflow.local",    firstName: "Sarah",  lastName: "Benali",   department: "Innovation & Tech",       monthsAgo: 11, engagement: 0.81, improving: false },
];

const TEAM_MEMBERS = {
  "thomas.rousseau@habitflow.local": [
    { email: "camille.dupont@habitflow.local", firstName: "Camille", lastName: "Dupont",  monthsAgo: 11, engagement: 0.82, improving: false },
    { email: "julien.mercier@habitflow.local", firstName: "Julien",  lastName: "Mercier", monthsAgo: 10, engagement: 0.65, improving: true  },
    { email: "amira.tazi@habitflow.local",     firstName: "Amira",   lastName: "Tazi",    monthsAgo: 9,  engagement: 0.73, improving: false },
    { email: "maxime.bernard@habitflow.local", firstName: "Maxime",  lastName: "Bernard", monthsAgo: 7,  engagement: 0.58, improving: true  },
  ],
  "sarah.benali@habitflow.local": [
    { email: "priya.sharma@habitflow.local",  firstName: "Priya",  lastName: "Sharma",  monthsAgo: 11, engagement: 0.79, improving: false },
    { email: "kevin.legrand@habitflow.local", firstName: "Kevin",  lastName: "Legrand", monthsAgo: 9,  engagement: 0.61, improving: true  },
    { email: "fatou.diallo@habitflow.local",  firstName: "Fatou",  lastName: "Diallo",  monthsAgo: 8,  engagement: 0.77, improving: false },
    { email: "romain.garcia@habitflow.local", firstName: "Romain", lastName: "Garcia",  monthsAgo: 5,  engagement: 0.54, improving: true  },
  ],
};

const GLOBAL_HABITS = [
  { nom: "Méditation du matin",      description: "10 minutes de méditation guidée pour démarrer la journée.",          categorie: "bien_etre",     frequence: "daily",  priorite: "high",   objectif: 10  },
  { nom: "8 verres d'eau par jour",  description: "Maintenir une hydratation optimale tout au long de la journée.",     categorie: "sante",         frequence: "daily",  priorite: "high",   objectif: 8   },
  { nom: "Lecture quotidienne",      description: "Lire au minimum 20 minutes par jour.",                               categorie: "apprentissage", frequence: "daily",  priorite: "medium", objectif: 20  },
  { nom: "10 000 pas quotidiens",    description: "Atteindre 10 000 pas chaque jour.",                                  categorie: "sport",         frequence: "daily",  priorite: "medium", objectif: 10000 },
  { nom: "Bilan hebdomadaire",       description: "Faire le point chaque vendredi soir sur ses accomplissements.",      categorie: "travail",       frequence: "weekly", priorite: "high",   objectif: null },
  { nom: "5 minutes de reconnaissance", description: "Identifier 3 choses positives de la journée avant de dormir.",   categorie: "bien_etre",     frequence: "daily",  priorite: "medium", objectif: 5   },
];

const PRIVATE_HABIT_POOL = [
  { nom: "Course matinale",        description: "Sortir courir tôt le matin, au moins 20 min.",                      categorie: "sport",         frequence: "daily",  priorite: "high"   },
  { nom: "Musculation",            description: "Séance de renforcement musculaire à la salle ou à domicile.",       categorie: "sport",         frequence: "weekly", priorite: "high"   },
  { nom: "Yoga du soir",           description: "Séquence de yoga de 15 min avant le coucher.",                      categorie: "sport",         frequence: "daily",  priorite: "medium" },
  { nom: "Journal intime",         description: "Écrire librement ses pensées et réflexions du jour.",               categorie: "bien_etre",     frequence: "daily",  priorite: "medium" },
  { nom: "Cours d'anglais",        description: "Pratiquer l'anglais 30 min via une appli.",                         categorie: "apprentissage", frequence: "weekly", priorite: "medium" },
  { nom: "Podcast éducatif",       description: "Écouter un podcast de développement personnel.",                    categorie: "apprentissage", frequence: "daily",  priorite: "low"    },
  { nom: "Revue des priorités",    description: "Lister ses 3 tâches importantes avant de commencer la journée.",    categorie: "travail",       frequence: "daily",  priorite: "high"   },
  { nom: "Prise de vitamines",     description: "Ne pas oublier ses compléments alimentaires du matin.",             categorie: "sante",         frequence: "daily",  priorite: "medium" },
  { nom: "Épargne hebdomadaire",   description: "Virer une somme fixe sur son compte épargne chaque semaine.",       categorie: "finance",       frequence: "weekly", priorite: "high"   },
  { nom: "Appel famille ou amis",  description: "Garder le contact avec ses proches au moins une fois par semaine.", categorie: "social",        frequence: "weekly", priorite: "medium" },
  { nom: "Pratique artistique",    description: "Dessiner, peindre ou écrire de la fiction.",                        categorie: "creativite",    frequence: "weekly", priorite: "low"    },
  { nom: "Sans écrans après 22h",  description: "Couper téléphone et ordinateur pour un meilleur sommeil.",          categorie: "bien_etre",     frequence: "daily",  priorite: "medium" },
  { nom: "Étirements quotidiens",  description: "15 min d'étirements pour améliorer la flexibilité.",                categorie: "sport",         frequence: "daily",  priorite: "low"    },
  { nom: "Contrôle des sucres",    description: "Éviter les sucres raffinés et les boissons sucrées.",               categorie: "sante",         frequence: "daily",  priorite: "medium" },
  { nom: "Deep work 90 min",       description: "Bloc de travail concentré sans interruption.",                      categorie: "travail",       frequence: "daily",  priorite: "high"   },
];

// Catégories attribuées par profil
const ADMIN_CATEGORIES    = ["sport", "bien_etre", "travail", "sante"];
const MANAGER_CATEGORIES  = ["sport", "travail", "bien_etre", "sante"];
const MEMBER_CATEGORIES   = ["sport", "sante", "bien_etre"];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function subtractMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - n);
  return d;
}

function logTimestamp(day) {
  const d = new Date(day);
  d.setHours(7 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function eachDay(from, to) {
  const days = [], cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to); end.setHours(23, 59, 59, 999);
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}

function pickPrivateHabits(rand, count = 4) {
  return [...PRIVATE_HABIT_POOL].sort(() => rand() - 0.5).slice(0, count + Math.floor(rand() * 2));
}

function completionProb({ engagement, improving, dayIndex, totalDays, isWeekend, categorie, date }) {
  let p = engagement * SEASONAL_FACTOR[date.getMonth()];
  if (improving) p += 0.22 * (dayIndex / Math.max(totalDays, 1));
  if (isWeekend) {
    if (categorie === "travail")         p *= 0.45;
    else if (categorie === "apprentissage") p *= 0.65;
    else if (categorie === "finance")    p *= 0.50;
    else if (categorie === "sport")      p *= 1.12;
    else if (categorie === "bien_etre")  p *= 1.08;
    else if (categorie === "social")     p *= 1.20;
    else if (categorie === "creativite") p *= 1.15;
  }
  return Math.min(0.94, Math.max(0.05, p));
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS DE SEED
// ─────────────────────────────────────────────────────────────────────────────

async function wipeDatabase(db) {
  await db.dropDatabase();
  console.log(`🗑️  Base "${db.databaseName}" supprimée.`);
}

async function seedRoles(db) {
  const col  = db.collection("roles");
  const docs = DEFAULT_ROLES.map(r => ({ _id: uuid(), ...r, createdAt: new Date(), updatedAt: new Date() }));
  await col.insertMany(docs);
  const map = {};
  for (const r of docs) map[r.nom] = r._id;
  console.log(`✅ ${docs.length} rôles créés.`);
  return map;
}

async function seedCategories(db) {
  const col  = db.collection("categories");
  const docs = Object.values(CATEGORIES).map(cat => ({
    _id: uuid(), ...cat,
    is_default: true, is_active: true,
    created_at: new Date(), createdAt: new Date(), updatedAt: new Date(),
  }));
  await col.insertMany(docs);
  console.log(`✅ ${docs.length} catégories créées.`);
}

async function seedUsers(db, roleIds) {
  const col  = db.collection("users");
  const hash = await bcrypt.hash(PASSWORD_PLACEHOLDER, 10);
  const now  = new Date();
  const byEmail = {};

  // Compte système
  await col.insertOne({
    _id: SYSTEM_ARCHIVED_USER_ID, firstName: "Archived", lastName: "[System]",
    email: "system-archived@habitflow.internal", passwordHash: null,
    role_id: roleIds.utilisateur, department: "",
    isActive: false, anonymized: true, is_system: true,
    createdAt: now, updatedAt: now,
  });

  // Admin
  const adminDoc = {
    _id: uuid(), firstName: "Admin", lastName: "System",
    email: "admin@habitflow.local", passwordHash: hash,
    role_id: roleIds.admin, department: "Direction",
    isActive: true, isFirstLogin: false,
    createdAt: subtractMonths(now, 12), updatedAt: now,
    first_login_at: subtractMonths(now, 12),
  };
  byEmail[adminDoc.email] = adminDoc;

  // Managers
  const managerDocs = [];
  for (const m of MANAGERS) {
    const doc = {
      _id: uuid(), firstName: m.firstName, lastName: m.lastName,
      email: m.email, passwordHash: hash,
      role_id: roleIds.manager, manager_id: null,
      department: m.department, isActive: true, isFirstLogin: false,
      createdAt: subtractMonths(now, m.monthsAgo), updatedAt: now,
      first_login_at: subtractMonths(now, m.monthsAgo),
      _engagement: m.engagement, _improving: m.improving,
    };
    managerDocs.push(doc);
    byEmail[doc.email] = doc;
  }

  // Membres
  const memberDocs = [];
  for (const mgr of MANAGERS) {
    const manager = byEmail[mgr.email];
    for (const u of TEAM_MEMBERS[mgr.email]) {
      const doc = {
        _id: uuid(), firstName: u.firstName, lastName: u.lastName,
        email: u.email, passwordHash: hash,
        role_id: roleIds.utilisateur, manager_id: manager._id,
        department: mgr.department, isActive: true, isFirstLogin: false,
        createdAt: subtractMonths(now, u.monthsAgo), updatedAt: now,
        first_login_at: subtractMonths(now, u.monthsAgo),
        _engagement: u.engagement, _improving: u.improving,
      };
      memberDocs.push(doc);
      byEmail[doc.email] = doc;
    }
  }

  await col.insertMany([adminDoc, ...managerDocs, ...memberDocs]);
  console.log(`✅ ${1 + managerDocs.length + memberDocs.length} utilisateurs créés (+ compte système).`);
  return { adminDoc, managerDocs, memberDocs, byEmail };
}

// ── NOUVELLE FONCTION : user_category_preferences ────────────────────────────
async function seedCategoryPreferences(db, adminDoc, managerDocs, memberDocs) {
  const col  = db.collection("user_category_preferences");
  const now  = new Date();
  const docs = [];

  const add = (user, slugs) => {
    for (const slug of slugs) {
      docs.push({
        _id:           uuid(),
        user_id:       user._id,
        category_slug: slug,
        created_at:    user.createdAt ?? now,
      });
    }
  };

  add(adminDoc, ADMIN_CATEGORIES);
  for (const m of managerDocs) add(m, MANAGER_CATEGORIES);
  for (const u of memberDocs)   add(u, MEMBER_CATEGORIES);

  await col.insertMany(docs);
  console.log(`✅ ${docs.length} user_category_preferences créées.`);

  // Retourne une map userId → [slugs] pour les autres fonctions
  const map = {};
  for (const d of docs) {
    if (!map[d.user_id]) map[d.user_id] = [];
    map[d.user_id].push(d.category_slug);
  }
  return map;
}

async function seedOnboardings(db, allNonAdminUsers) {
  const col  = db.collection("onboardings");
  const docs = allNonAdminUsers.map(u => ({
    _id:        uuid(),
    user_id:    u._id,
    status:     "completed",
    completed:  true,
    step:       4,
    data:       {},
    createdAt:  new Date(u.createdAt),
    updatedAt:  new Date(u.createdAt),
  }));
  await col.insertMany(docs);
  console.log(`✅ ${docs.length} onboardings créés (complétés).`);
}

async function seedGlobalHabits(db, adminDoc) {
  const col  = db.collection("habits");
  const now  = new Date();
  const base = new Date(adminDoc.createdAt);

  const docs = GLOBAL_HABITS.map((h, i) => {
    const created = new Date(base);
    created.setDate(created.getDate() + i * 3);
    return {
      _id: uuid(), nom: h.nom, description: h.description,
      categorie: h.categorie, frequence: h.frequence,
      statut: "active", priorite: h.priorite,
      user_id: adminDoc._id, visible_pour_tous: true, is_global: true,
      objectif: h.objectif ?? null,
      date_debut: created, createdAt: created, updatedAt: now,
    };
  });

  await col.insertMany(docs);
  console.log(`✅ ${docs.length} habitudes globales créées.`);
  return docs;
}

async function seedPrivateHabits(db, allUsers) {
  const col    = db.collection("habits");
  const now    = new Date();
  const habits = [];

  for (const user of allUsers) {
    const rand  = mulberry32(user.email.split("").reduce((s, c) => s + c.charCodeAt(0), 0) * 997);
    const picks = pickPrivateHabits(rand, 3);
    for (const tpl of picks) {
      const created = new Date(user.createdAt);
      created.setDate(created.getDate() + Math.floor(rand() * 10) + 2);
      habits.push({
        _id: uuid(), nom: tpl.nom, description: tpl.description,
        categorie: tpl.categorie, frequence: tpl.frequence,
        statut: rand() > 0.07 ? "active" : "pause", priorite: tpl.priorite,
        user_id: user._id, visible_pour_tous: false, is_global: false,
        objectif: null, date_debut: created,
        createdAt: created, updatedAt: now,
        _owner: user,
      });
    }
  }

  await col.insertMany(habits.map(({ _owner, ...h }) => h));
  console.log(`✅ ${habits.length} habitudes privées créées.`);
  return habits;
}

async function seedHabitNotes(db, privateHabits) {
  const col   = db.collection("habits");
  const notes = [
    "Bon début, j'arrive à tenir le rythme cette semaine.",
    "Difficile de rester motivé les jours de pluie.",
    "Objectif atteint 5 jours sur 7, très satisfait !",
    "Je dois améliorer ma régularité le week-end.",
    "Meilleure semaine depuis le début, je continue.",
    "J'ai modifié mon heure habituelle, mieux le matin.",
    "Besoin de revoir mon objectif, trop ambitieux.",
    "Progrès notable ce mois-ci, je sens la différence.",
  ];
  let count = 0;
  for (let i = 0; i < privateHabits.length; i++) {
    if (i % 3 !== 0) continue;
    await col.updateOne(
      { _id: privateHabits[i]._id },
      { $set: { note: notes[i % notes.length], updatedAt: new Date() } }
    );
    count++;
  }
  console.log(`✅ ${count} notes ajoutées sur des habitudes privées.`);
}

async function seedUserHabitSettings(db, globalHabits, allNonAdminUsers, categoryPrefMap) {
  const col  = db.collection("user_habit_settings");
  const now  = new Date();
  const docs = [];

  for (const user of allNonAdminUsers) {
    const userCats = new Set(categoryPrefMap[user._id] ?? []);
    for (const habit of globalHabits) {
      if (userCats.has(habit.categorie)) {
        docs.push({
          _id: uuid(), user_id: user._id, habit_id: habit._id,
          statut_perso: "actif",
          activated_at: new Date(user.createdAt),
          createdAt: new Date(user.createdAt), updatedAt: now,
        });
      }
    }
  }

  if (docs.length > 0) await col.insertMany(docs);
  console.log(`✅ ${docs.length} user_habit_settings créés.`);
}

async function seedLogs(db, habitUserPairs, periodStart, periodEnd) {
  const col  = db.collection("habit-logs");
  const logs = [];
  const days = eachDay(periodStart, periodEnd);

  for (const { habit, user } of habitUserPairs) {
    const rand = mulberry32(
      (user.email + habit.nom).split("").reduce((s, c) => s + c.charCodeAt(0), 0) * 131
    );
    const userStart = new Date(Math.max(
      new Date(habit.date_debut ?? habit.createdAt).getTime(),
      new Date(user.createdAt).getTime(),
      periodStart.getTime()
    ));
    const eligibleDays = days.filter(d => d >= userStart);
    const totalDays    = eligibleDays.length;

    eligibleDays.forEach((day, dayIndex) => {
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      if (habit.frequence === "weekly" && day.getDay() !== 1 && rand() > 0.25) return;

      const p = completionProb({
        engagement: user._engagement ?? 0.70,
        improving:  user._improving  ?? false,
        dayIndex, totalDays, isWeekend,
        categorie: habit.categorie, date: day,
      });

      if (rand() > p + 0.08) return;
      const roll = rand();
      const statut = roll > p ? "non_completee" : roll < 0.04 ? "manquee" : "completee";
      const ts = logTimestamp(day);
      logs.push({
        _id: uuid(), habit_id: habit._id, user_id: user._id,
        date: ts, statut, createdAt: ts, updatedAt: ts,
      });
    });
  }

  const BATCH = 800;
  for (let i = 0; i < logs.length; i += BATCH)
    await col.insertMany(logs.slice(i, i + BATCH));

  console.log(`✅ ${logs.length} logs créés (12 mois, tendances saisonnières).`);
  return logs;
}

async function seedOffDays(db, adminId) {
  const col  = db.collection("off-days");
  const now  = new Date();
  const year = now.getFullYear();

  const holidays = [
    { date: `${year}-01-01`, label: "Jour de l'An",               type: "holiday" },
    { date: `${year}-05-01`, label: "Fête du Travail",            type: "holiday" },
    { date: `${year}-05-08`, label: "Victoire 1945",              type: "holiday" },
    { date: `${year}-07-14`, label: "Fête Nationale",             type: "holiday" },
    { date: `${year}-08-15`, label: "Assomption",                 type: "holiday" },
    { date: `${year}-11-01`, label: "Toussaint",                  type: "holiday" },
    { date: `${year}-11-11`, label: "Armistice",                  type: "holiday" },
    { date: `${year}-12-25`, label: "Noël",                       type: "holiday" },
    { date: `${year}-12-31`, label: "Maintenance serveurs",       type: "maintenance" },
    { date: `${year}-09-01`, label: "Rentrée — journée spéciale", type: "special" },
  ];

  const docs = holidays.map(h => ({
    _id:        uuid(),
    date:       new Date(h.date),
    label:      h.label,
    type:       h.type,
    created_by: adminId,
    createdAt:  now,
    updatedAt:  now,
  }));

  await col.insertMany(docs);
  console.log(`✅ ${docs.length} off-days créés (jours fériés + maintenance).`);
}

async function seedCategoryTickets(db, memberDocs, managerDocs) {
  const col  = db.collection("category-tickets");
  const now  = new Date();

  const ticketTemplates = [
    { requested_name: "Spiritualité",    description: "Méditation, prière, pratique spirituelle.",          type: "categorie", scope: "personal", status: "pending"   },
    { requested_name: "Bricolage",       description: "Projets manuels, réparations, DIY à la maison.",     type: "categorie", scope: "personal", status: "in_review" },
    { requested_name: "Photographie",   description: "Sortir pratiquer la photo ou traiter des images.",   type: "categorie", scope: "personal", status: "done"      },
    { requested_name: "Cuisine saine",  description: "Préparer des repas équilibrés et fait maison.",      type: "categorie", scope: "personal", status: "pending"   },
    { requested_name: "Cohésion équipe",description: "Activités de team building pour renforcer l'équipe.",type: "categorie", scope: "team",     status: "in_review" },
    { requested_name: "Veille techno",  description: "Suivre les actualités technologiques 15 min/jour.",  type: "categorie", scope: "team",     status: "pending"   },
  ];

  const allSubmitters = [...memberDocs, ...managerDocs];
  const docs = ticketTemplates.map((tpl, i) => {
    const submitter  = allSubmitters[i % allSubmitters.length];
    const createdAt  = new Date(now);
    createdAt.setDate(createdAt.getDate() - (ticketTemplates.length - i) * 5);

    return {
      _id:            uuid(),
      user_id:        submitter._id,
      type:           tpl.type,
      requested_name: tpl.requested_name,
      description:    tpl.description,
      scope:          tpl.scope,
      status:         tpl.status,
      admin_note:     tpl.status === "done" ? "Catégorie approuvée et ajoutée." : null,
      resolved_by:    tpl.status === "done" ? submitter._id : null,
      resolved_at:    tpl.status === "done" ? now : null,
      createdAt,
      updatedAt:      now,
    };
  });

  await col.insertMany(docs);
  console.log(`✅ ${docs.length} category-tickets créés (pending/in_review/done).`);
}

async function seedHabitStats(db, logs, allHabits, allUsers) {
  const col = db.collection("habit-stats");
  const now = new Date();
  const docs = [];

  // Regrouper logs par (habit_id, user_id)
  const grouped = {};
  for (const log of logs) {
    const key = `${log.habit_id}__${log.user_id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  }

  const habitMap = Object.fromEntries(allHabits.map(h => [h._id, h]));
  const userMap  = Object.fromEntries(allUsers.map(u => [u._id, u]));

  for (const [key, entries] of Object.entries(grouped)) {
    const [habitId, userId] = key.split("__");
    const habit = habitMap[habitId];
    const user  = userMap[userId];
    if (!habit || !user) continue;

    const completed = entries.filter(l => l.statut === "completee").sort((a, b) => new Date(a.date) - new Date(b.date));
    if (completed.length === 0) continue;

    // Calcul streak courant
    let currentStreak = 0;
    let bestStreak    = 0;
    let streak        = 0;
    let prevDate      = null;

    for (const log of completed) {
      const d = new Date(log.date);
      d.setHours(0, 0, 0, 0);
      if (prevDate) {
        const diff = (d - prevDate) / 86400000;
        streak = diff === 1 ? streak + 1 : 1;
      } else {
        streak = 1;
      }
      bestStreak = Math.max(bestStreak, streak);
      prevDate   = d;
    }

    // Streak courant : vérifie si le dernier log est récent (≤ 2 jours)
    const lastDate = new Date(completed[completed.length - 1].date);
    lastDate.setHours(0, 0, 0, 0);
    const diffToday = (new Date().setHours(0,0,0,0) - lastDate.getTime()) / 86400000;
    currentStreak = diffToday <= 2 ? streak : 0;

    docs.push({
      _id:               uuid(),
      habit_id:          habitId,
      user_id:           userId,
      currentStreak,
      bestStreak,
      lastCompletedDate: completed[completed.length - 1].date,
      lastCalculatedAt:  now,
      createdAt:         user.createdAt ?? now,
      updatedAt:         now,
    });
  }

  if (docs.length > 0) {
    const BATCH = 500;
    for (let i = 0; i < docs.length; i += BATCH)
      await col.insertMany(docs.slice(i, i + BATCH));
  }
  console.log(`✅ ${docs.length} habit-stats créés (streaks calculés).`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRÉE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

export async function seedFullYear() {
  const uri    = process.env.MONGO_URI || "mongodb://127.0.0.1:27018/habitflow";
  const client = await MongoDBManager.connect(uri);
  const db     = client.db();

  const periodEnd   = new Date();
  const periodStart = subtractMonths(periodEnd, MONTHS_BACK);
  periodStart.setHours(0, 0, 0, 0);

  console.log("\n🌱 HabitFlow — seed 1 an de données réalistes\n");
  console.log(`   MongoDB  : ${uri}`);
  console.log(`   Période  : ${periodStart.toISOString().slice(0, 10)} → ${periodEnd.toISOString().slice(0, 10)}\n`);

  await wipeDatabase(db);

  const roleIds = await seedRoles(db);
  await seedCategories(db);

  const { adminDoc, managerDocs, memberDocs } = await seedUsers(db, roleIds);

  const allNonAdminUsers = [
    ...managerDocs.map(m => ({ ...m, _engagement: m._engagement ?? 0.76, _improving: m._improving ?? false })),
    ...memberDocs,
  ];

  // ── Tables de base ────────────────────────────────────────────────────────
  const categoryPrefMap = await seedCategoryPreferences(db, adminDoc, managerDocs, memberDocs);
  await seedOnboardings(db, allNonAdminUsers);
  await seedOffDays(db, adminDoc._id);
  await seedCategoryTickets(db, memberDocs, managerDocs);

  // ── Habitudes ─────────────────────────────────────────────────────────────
  const globalHabits  = await seedGlobalHabits(db, adminDoc);
  const privateHabits = await seedPrivateHabits(db, allNonAdminUsers);

  await seedHabitNotes(db, privateHabits);
  await seedUserHabitSettings(db, globalHabits, allNonAdminUsers, categoryPrefMap);

  // ── Logs ──────────────────────────────────────────────────────────────────
  const globalPairs  = globalHabits.flatMap(habit => allNonAdminUsers.map(user => ({ habit, user })));
  const privatePairs = privateHabits
    .map(habit => ({ habit, user: allNonAdminUsers.find(u => u._id === habit.user_id) }))
    .filter(p => p.user != null);

  const logs = await seedLogs(db, [...globalPairs, ...privatePairs], periodStart, periodEnd);

  // ── Stats (streaks) ───────────────────────────────────────────────────────
  const allHabits = [...globalHabits, ...privateHabits];
  const allUsers  = [adminDoc, ...managerDocs, ...memberDocs];
  await seedHabitStats(db, logs, allHabits, allUsers);

  await MongoDBManager.closeAll();

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           COMPTES CRÉÉS — Connexion LDAP                    ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Admin     : admin@habitflow.local          / Admin123!      ║");
  console.log("║  Managers  : *@habitflow.local              / Manager123!    ║");
  console.log("║  Users     : *@habitflow.local              / User123!       ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Collections remplies :                                      ║");
  console.log("║    roles · categories · users · habits · habit-logs          ║");
  console.log("║    user_habit_settings · user_category_preferences           ║");
  console.log("║    habit-stats · onboardings                                 ║");
  console.log("║    off-days · category-tickets                               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

const isMain = process.argv[1]?.includes("seed-full-year");
if (isMain) {
  seedFullYear()
    .then(() => { console.log("✅ Seed 1 an terminé.\n"); process.exit(0); })
    .catch(err => { console.error("❌ Seed échoué :", err); process.exit(1); });
}
