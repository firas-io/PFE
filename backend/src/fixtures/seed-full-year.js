/**
 * HabitFlow — Seed 1 an de données réalistes
 *
 * Structure :
 *   · 1 admin
 *   · 2 managers (Équipe Performance & Équipe Innovation)
 *   · 8 utilisateurs (4 par manager)
 *   · 6 habitudes globales créées par l'admin (publiques, visibles par tous)
 *   · 3–5 habitudes privées par utilisateur
 *   · 12 mois de logs d'utilisation avec tendances saisonnières réalistes
 *
 * Exécution (depuis backend/) :
 *   node --import ./src/loader.js src/fixtures/seed-full-year.js
 *
 * Variable d'environnement :
 *   MONGO_URI  (défaut : mongodb://127.0.0.1:27018/habitflow)
 */

import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { MongoDBManager } from "../core/mongo.connect.js";
import { CATEGORIES } from "../shared/constants/categories.js";
import { SYSTEM_ARCHIVED_USER_ID } from "../modules/users/constants/users.constants.js";

const MONTHS_BACK = 12;
const PASSWORD_PLACEHOLDER = "LDAP_ONLY";

// Facteur saisonnier (index 0 = janvier) — modifie la probabilité de complétion
const SEASONAL_FACTOR = [
  1.20, // Janvier  : résolutions du Nouvel An
  1.00, // Février  : retour à la normale
  1.05, // Mars     : énergie printanière
  1.08, // Avril    : beau temps
  1.05, // Mai      : pré-été
  0.92, // Juin     : avant les vacances
  0.80, // Juillet  : vacances d'été
  0.78, // Août     : pleine saison estivale
  1.18, // Septembre: rentrée, regain de motivation
  1.00, // Octobre  : routine installée
  0.90, // Novembre : jours sombres
  0.85, // Décembre : distractions des fêtes
];

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES DE RÉFÉRENCE
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ROLES = [
  {
    nom: "admin",
    description: "Administrateur plateforme",
    permissions: [
      "MANAGERS_MANAGE", "MANAGER_TEAM_VIEW", "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
      "ROLES_VIEW", "ROLES_MANAGE", "USERS_VIEW", "USERS_MANAGE",
      "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE", "LOGS_VIEW", "LOGS_MANAGE",
      "STATS_VIEW", "STATS_MANAGE", "ONBOARDING_VIEW", "ONBOARDING_MANAGE",
      "REMINDERS_VIEW", "REMINDERS_MANAGE", "SESSIONS_VIEW", "SESSIONS_MANAGE",
      "ADMIN_STATS_VIEW", "OFFDAYS_VIEW", "OFF_DAYS_MANAGE", "TICKETS_MANAGE",
      "CATEGORIES_VIEW", "CATEGORIES_MANAGE",
    ],
  },
  {
    nom: "manager",
    description: "Responsable d'équipe",
    permissions: [
      "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
      "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE", "LOGS_VIEW", "LOGS_MANAGE",
      "PROGRESS_VIEW", "ONBOARDING_VIEW", "REMINDERS_VIEW", "SESSIONS_VIEW",
      "OFFDAYS_VIEW", "STATS_VIEW",
    ],
  },
  {
    nom: "utilisateur",
    description: "Utilisateur standard",
    permissions: [
      "SELF_VIEW", "SELF_EDIT", "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
      "LOGS_VIEW", "LOGS_MANAGE", "PROGRESS_VIEW", "ONBOARDING_VIEW",
      "REMINDERS_VIEW", "SESSIONS_VIEW", "OFFDAYS_VIEW",
    ],
  },
];

const MANAGERS = [
  {
    email: "thomas.rousseau@habitflow.local",
    firstName: "Thomas",
    lastName: "Rousseau",
    department: "Bien-être & Performance",
    monthsAgo: 12,
    engagement: 0.78,
    improving: false,
  },
  {
    email: "sarah.benali@habitflow.local",
    firstName: "Sarah",
    lastName: "Benali",
    department: "Innovation & Tech",
    monthsAgo: 11,
    engagement: 0.81,
    improving: false,
  },
];

const TEAM_MEMBERS = {
  "thomas.rousseau@habitflow.local": [
    { email: "camille.dupont@habitflow.local",  firstName: "Camille", lastName: "Dupont",  monthsAgo: 11, engagement: 0.82, improving: false },
    { email: "julien.mercier@habitflow.local",  firstName: "Julien",  lastName: "Mercier", monthsAgo: 10, engagement: 0.65, improving: true  },
    { email: "amira.tazi@habitflow.local",      firstName: "Amira",   lastName: "Tazi",    monthsAgo: 9,  engagement: 0.73, improving: false },
    { email: "maxime.bernard@habitflow.local",  firstName: "Maxime",  lastName: "Bernard", monthsAgo: 7,  engagement: 0.58, improving: true  },
  ],
  "sarah.benali@habitflow.local": [
    { email: "priya.sharma@habitflow.local",   firstName: "Priya",  lastName: "Sharma",  monthsAgo: 11, engagement: 0.79, improving: false },
    { email: "kevin.legrand@habitflow.local",  firstName: "Kevin",  lastName: "Legrand", monthsAgo: 9,  engagement: 0.61, improving: true  },
    { email: "fatou.diallo@habitflow.local",   firstName: "Fatou",  lastName: "Diallo",  monthsAgo: 8,  engagement: 0.77, improving: false },
    { email: "romain.garcia@habitflow.local",  firstName: "Romain", lastName: "Garcia",  monthsAgo: 5,  engagement: 0.54, improving: true  },
  ],
};

// Habitudes globales — créées par l'admin, publiques (visible_pour_tous: true)
const GLOBAL_HABITS = [
  {
    nom: "Méditation du matin",
    description: "10 minutes de méditation guidée pour démarrer la journée avec clarté et sérénité. Recommandée avant 9h.",
    categorie: "bien_etre",
    frequence: "daily",
    priorite: "high",
    objectif: 10,
    duree_estimee: 10,
  },
  {
    nom: "8 verres d'eau par jour",
    description: "Maintenir une hydratation optimale tout au long de la journée. Posez une bouteille sur votre bureau.",
    categorie: "sante",
    frequence: "daily",
    priorite: "high",
    objectif: 8,
    duree_estimee: null,
  },
  {
    nom: "Lecture quotidienne",
    description: "Lire au minimum 20 minutes par jour pour développer ses connaissances — fiction ou non-fiction.",
    categorie: "apprentissage",
    frequence: "daily",
    priorite: "medium",
    objectif: 20,
    duree_estimee: 20,
  },
  {
    nom: "10 000 pas quotidiens",
    description: "Atteindre 10 000 pas chaque jour pour maintenir une activité physique minimale. Utilisez un podomètre.",
    categorie: "sport",
    frequence: "daily",
    priorite: "medium",
    objectif: 10000,
    duree_estimee: 30,
  },
  {
    nom: "Bilan hebdomadaire",
    description: "Faire le point chaque vendredi soir : accomplissements, points bloquants, priorités de la semaine suivante.",
    categorie: "travail",
    frequence: "weekly",
    priorite: "high",
    objectif: null,
    duree_estimee: 30,
  },
  {
    nom: "5 minutes de reconnaissance",
    description: "Identifier 3 choses positives de la journée avant de dormir. Cultivez la gratitude au quotidien.",
    categorie: "bien_etre",
    frequence: "daily",
    priorite: "medium",
    objectif: 5,
    duree_estimee: 5,
  },
];

// Pool d'habitudes privées — chaque utilisateur en pioche 3 à 5
const PRIVATE_HABIT_POOL = [
  { nom: "Course matinale",           description: "Sortir courir tôt le matin, au moins 20 min.",                     categorie: "sport",         frequence: "daily",  priorite: "high"   },
  { nom: "Musculation",               description: "Séance de renforcement musculaire à la salle ou à domicile.",       categorie: "sport",         frequence: "weekly", priorite: "high"   },
  { nom: "Yoga du soir",              description: "Séquence de yoga de 15 min pour détendre le corps avant le coucher.", categorie: "sport",        frequence: "daily",  priorite: "medium" },
  { nom: "Journal intime",            description: "Écrire librement ses pensées, émotions et réflexions du jour.",      categorie: "bien_etre",     frequence: "daily",  priorite: "medium" },
  { nom: "Cours d'anglais",           description: "Pratiquer l'anglais 30 min via une appli ou du contenu authentique.", categorie: "apprentissage", frequence: "weekly", priorite: "medium" },
  { nom: "Podcast éducatif",          description: "Écouter un podcast de développement personnel ou de culture générale.", categorie: "apprentissage", frequence: "daily",  priorite: "low"   },
  { nom: "Revue des priorités",       description: "Lister et prioriser ses 3 tâches importantes avant de commencer la journée.", categorie: "travail", frequence: "daily",  priorite: "high"   },
  { nom: "Prise de vitamines",        description: "Ne pas oublier ses compléments alimentaires du matin.",              categorie: "sante",         frequence: "daily",  priorite: "medium" },
  { nom: "Épargne hebdomadaire",      description: "Virer une somme fixe sur son compte épargne chaque semaine.",        categorie: "finance",       frequence: "weekly", priorite: "high"   },
  { nom: "Appel famille ou amis",     description: "Garder le contact avec ses proches au moins une fois par semaine.",  categorie: "social",        frequence: "weekly", priorite: "medium" },
  { nom: "Pratique artistique",       description: "Dessiner, peindre, écrire de la fiction ou tout autre acte créatif.", categorie: "creativite",    frequence: "weekly", priorite: "low"    },
  { nom: "Sans écrans après 22h",     description: "Couper téléphone et ordinateur pour favoriser un sommeil de qualité.", categorie: "bien_etre",    frequence: "daily",  priorite: "medium" },
  { nom: "Étirements quotidiens",     description: "15 min d'étirements pour améliorer la flexibilité et réduire les tensions.", categorie: "sport",   frequence: "daily",  priorite: "low"    },
  { nom: "Contrôle des sucres",       description: "Éviter les sucres raffinés et les boissons sucrées ce jour.",        categorie: "sante",         frequence: "daily",  priorite: "medium" },
  { nom: "Deep work 90 min",          description: "Bloc de travail concentré sans interruption : téléphone coupé, notifications off.", categorie: "travail", frequence: "daily",  priorite: "high"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
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
  const days = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function pickPrivateHabits(rand, count = 4) {
  const shuffled = [...PRIVATE_HABIT_POOL].sort(() => rand() - 0.5);
  return shuffled.slice(0, count + Math.floor(rand() * 2));
}

/**
 * Probabilité de complétion pour un jour donné.
 * Prend en compte : engagement de base, saison, amélioration progressive, week-end.
 */
function completionProb({ engagement, improving, dayIndex, totalDays, isWeekend, categorie, date }) {
  let p = engagement;

  // Facteur saisonnier
  p *= SEASONAL_FACTOR[date.getMonth()];

  // Amélioration progressive sur l'année
  if (improving) {
    p += 0.22 * (dayIndex / Math.max(totalDays, 1));
  }

  // Ajustements week-end selon catégorie
  if (isWeekend) {
    if (categorie === "travail")        p *= 0.45;
    else if (categorie === "apprentissage") p *= 0.65;
    else if (categorie === "finance")   p *= 0.50;
    else if (categorie === "sport")     p *= 1.12;
    else if (categorie === "bien_etre") p *= 1.08;
    else if (categorie === "social")    p *= 1.20;
    else if (categorie === "creativite") p *= 1.15;
  }

  return Math.min(0.94, Math.max(0.05, p));
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS DE SEED
// ─────────────────────────────────────────────────────────────────────────────

async function wipeDatabase(db) {
  const name = db.databaseName;
  await db.dropDatabase();
  console.log(`🗑️  Base "${name}" supprimée.`);
}

async function seedRoles(db) {
  const col = db.collection("roles");
  const docs = DEFAULT_ROLES.map(r => ({
    _id: uuid(),
    ...r,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await col.insertMany(docs);
  const map = {};
  for (const r of docs) map[r.nom] = r._id;
  console.log(`✅ ${docs.length} rôles créés.`);
  return map;
}

async function seedCategories(db) {
  const col = db.collection("categories");
  const docs = Object.values(CATEGORIES).map(cat => ({
    _id:        uuid(),
    ...cat,
    is_default: true,
    is_active:  true,
    created_at: new Date(),
    createdAt:  new Date(),
    updatedAt:  new Date(),
  }));
  await col.insertMany(docs);
  console.log(`✅ ${docs.length} catégories créées.`);
}

async function seedUsers(db, roleIds) {
  const col  = db.collection("users");
  const hash = await bcrypt.hash(PASSWORD_PLACEHOLDER, 10);
  const now  = new Date();
  const byEmail = {};

  // Compte système (obligatoire pour la suppression douce des utilisateurs)
  await col.insertOne({
    _id:          SYSTEM_ARCHIVED_USER_ID,
    firstName:    "Archived",
    lastName:     "[System]",
    email:        "system-archived@habitflow.internal",
    passwordHash: null,
    role_id:      roleIds.utilisateur,
    department:   "",
    isActive:     false,
    anonymized:   true,
    is_system:    true,
    createdAt:    now,
    updatedAt:    now,
  });

  // Admin
  const adminDoc = {
    _id:           uuid(),
    firstName:     "Admin",
    lastName:      "System",
    email:         "admin@habitflow.local",
    passwordHash:  hash,
    role_id:       roleIds.admin,
    department:    "Direction",
    isActive:      true,
    isFirstLogin:  false,
    categories:    ["sport", "bien_etre", "travail", "sante"],
    createdAt:     subtractMonths(now, 12),
    updatedAt:     now,
    first_login_at: subtractMonths(now, 12),
  };
  byEmail[adminDoc.email] = adminDoc;

  // Managers
  const managerDocs = [];
  for (const m of MANAGERS) {
    const doc = {
      _id:           uuid(),
      firstName:     m.firstName,
      lastName:      m.lastName,
      email:         m.email,
      passwordHash:  hash,
      role_id:       roleIds.manager,
      manager_id:    null,
      department:    m.department,
      isActive:      true,
      isFirstLogin:  false,
      categories:    ["sport", "travail", "bien_etre", "sante"],
      createdAt:     subtractMonths(now, m.monthsAgo),
      updatedAt:     now,
      first_login_at: subtractMonths(now, m.monthsAgo),
      _engagement:   m.engagement,
      _improving:    m.improving,
    };
    managerDocs.push(doc);
    byEmail[doc.email] = doc;
  }

  // Membres de l'équipe
  const memberDocs = [];
  for (const mgr of MANAGERS) {
    const manager = byEmail[mgr.email];
    for (const u of TEAM_MEMBERS[mgr.email]) {
      const doc = {
        _id:           uuid(),
        firstName:     u.firstName,
        lastName:      u.lastName,
        email:         u.email,
        passwordHash:  hash,
        role_id:       roleIds.utilisateur,
        manager_id:    manager._id,
        department:    mgr.department,
        isActive:      true,
        isFirstLogin:  false,
        categories:    ["sport", "sante", "bien_etre"],
        createdAt:     subtractMonths(now, u.monthsAgo),
        updatedAt:     now,
        first_login_at: subtractMonths(now, u.monthsAgo),
        _engagement:   u.engagement,
        _improving:    u.improving,
      };
      memberDocs.push(doc);
      byEmail[doc.email] = doc;
    }
  }

  await col.insertMany([adminDoc, ...managerDocs, ...memberDocs]);
  console.log(`✅ ${1 + managerDocs.length + memberDocs.length} utilisateurs créés (+ compte système).`);
  return { adminDoc, managerDocs, memberDocs, byEmail };
}

async function seedGlobalHabits(db, adminDoc) {
  const col = db.collection("habits");
  const now = new Date();
  const adminCreatedAt = new Date(adminDoc.createdAt);

  const docs = GLOBAL_HABITS.map((h, i) => {
    const created = new Date(adminCreatedAt);
    created.setDate(created.getDate() + i * 3); // Échelonnées sur les premiers jours
    return {
      _id:             uuid(),
      nom:             h.nom,
      description:     h.description,
      categorie:       h.categorie,
      frequence:       h.frequence,
      statut:          "active",
      priorite:        h.priorite,
      user_id:         adminDoc._id,
      visible_pour_tous: true,
      is_global:       true,
      objectif:        h.objectif ?? null,
      duree_estimee:   h.duree_estimee ?? null,
      date_debut:      created,
      createdAt:       created,
      updatedAt:       now,
    };
  });

  await col.insertMany(docs);
  console.log(`✅ ${docs.length} habitudes globales créées (admin, publiques).`);
  return docs;
}

async function seedPrivateHabits(db, allUsers) {
  const col = db.collection("habits");
  const now = new Date();
  const habits = [];

  for (const user of allUsers) {
    const rand = mulberry32(user.email.split("").reduce((s, c) => s + c.charCodeAt(0), 0) * 997);
    const picks = pickPrivateHabits(rand, 3);
    for (const tpl of picks) {
      const created = new Date(user.createdAt);
      created.setDate(created.getDate() + Math.floor(rand() * 10) + 2);
      habits.push({
        _id:             uuid(),
        nom:             tpl.nom,
        description:     tpl.description,
        categorie:       tpl.categorie,
        frequence:       tpl.frequence,
        statut:          rand() > 0.07 ? "active" : "pause",
        priorite:        tpl.priorite,
        user_id:         user._id,
        visible_pour_tous: false,
        is_global:       false,
        objectif:        null,
        duree_estimee:   null,
        date_debut:      created,
        createdAt:       created,
        updatedAt:       now,
        _owner:          user,
      });
    }
  }

  await col.insertMany(habits.map(({ _owner, ...h }) => h));
  console.log(`✅ ${habits.length} habitudes privées créées.`);
  return habits;
}

/**
 * Génère les logs d'habitudes pour une liste de paires { habit, user }.
 * Gère à la fois les habitudes globales (partagées par tous les users)
 * et les habitudes privées (un seul owner).
 */
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

      // Sauter les habitudes hebdomadaires les jours non-hebdomadaires (garder ~1 jour/7)
      if (habit.frequence === "weekly" && day.getDay() !== 1 && rand() > 0.25) return;

      const p = completionProb({
        engagement: user._engagement ?? 0.70,
        improving:  user._improving  ?? false,
        dayIndex,
        totalDays,
        isWeekend,
        categorie:  habit.categorie,
        date:       day,
      });

      // Décision de créer un log ce jour
      if (rand() > p + 0.08) return;

      const roll   = rand();
      let statut   = "completee";
      if (roll > p)      statut = "non_completee";
      else if (roll < 0.04) statut = "manquee";

      const ts = logTimestamp(day);
      logs.push({
        _id:       uuid(),
        habit_id:  habit._id,
        user_id:   user._id,
        date:      ts,
        statut,
        createdAt: ts,
        updatedAt: ts,
      });
    });
  }

  // Insertion par lots de 800
  const BATCH = 800;
  for (let i = 0; i < logs.length; i += BATCH) {
    await col.insertMany(logs.slice(i, i + BATCH));
  }
  console.log(`✅ ${logs.length} logs créés (12 mois, tendances saisonnières incluses).`);
  return logs.length;
}

async function seedHabitNotes(db, privateHabits) {
  const col  = db.collection("habits");
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

  // Ajouter une note sur ~40% des habitudes privées
  let count = 0;
  for (let i = 0; i < privateHabits.length; i++) {
    if (i % 3 !== 0) continue; // 1 sur 3
    const habit   = privateHabits[i];
    const note    = notes[i % notes.length];
    await col.updateOne({ _id: habit._id }, { $set: { note, updatedAt: new Date() } });
    count++;
  }
  console.log(`✅ ${count} notes ajoutées sur des habitudes privées.`);
}

async function seedUserHabitSettings(db, globalHabits, allNonAdminUsers) {
  const col  = db.collection("user_habit_settings");
  const docs = [];
  const now  = new Date();

  for (const user of allNonAdminUsers) {
    const userCats = new Set(user.categories ?? []);
    for (const habit of globalHabits) {
      if (userCats.has(habit.categorie)) {
        docs.push({
          _id:          uuid(),
          user_id:      user._id,
          habit_id:     habit._id,
          statut_perso: "actif",
          activated_at: new Date(user.createdAt),
          createdAt:    new Date(user.createdAt),
          updatedAt:    now,
        });
      }
    }
  }

  if (docs.length > 0) await col.insertMany(docs);
  console.log(`✅ ${docs.length} user_habit_settings créés (activation automatique par catégorie).`);
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

  // Habitudes globales (créées par l'admin)
  const globalHabits = await seedGlobalHabits(db, adminDoc);

  // Habitudes privées (managers + membres)
  const allNonAdminUsers = [
    ...managerDocs.map(m => ({ ...m, _engagement: m._engagement ?? 0.76, _improving: m._improving ?? false })),
    ...memberDocs,
  ];
  const privateHabits = await seedPrivateHabits(db, allNonAdminUsers);

  // Construction des paires (habit, user) pour la génération des logs
  // 1. Habitudes globales × tous les utilisateurs non-admin
  const globalPairs = globalHabits.flatMap(habit =>
    allNonAdminUsers.map(user => ({ habit, user }))
  );

  // 2. Habitudes privées × leur owner
  const privatePairs = privateHabits.map(habit => ({
    habit,
    user: allNonAdminUsers.find(u => u._id === habit.user_id),
  })).filter(p => p.user != null);

  await seedHabitNotes(db, privateHabits);
  await seedUserHabitSettings(db, globalHabits, allNonAdminUsers);
  await seedLogs(db, [...globalPairs, ...privatePairs], periodStart, periodEnd);

  await MongoDBManager.closeAll();

  // ─── Récapitulatif ──────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           COMPTES CRÉÉS — Connexion LDAP                    ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Admin     : admin@habitflow.local          / Admin123!      ║");
  console.log("║  Managers  : *@habitflow.local              / Manager123!    ║");
  console.log("║  Users     : *@habitflow.local              / User123!       ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Équipe Thomas Rousseau (Bien-être & Performance) :          ║");
  console.log("║    · camille.dupont   (engagement élevé, stable)            ║");
  console.log("║    · julien.mercier   (engagement moyen, en progression)    ║");
  console.log("║    · amira.tazi       (engagement bon, stable)              ║");
  console.log("║    · maxime.bernard   (engagement faible, en progression)   ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Équipe Sarah Benali (Innovation & Tech) :                   ║");
  console.log("║    · priya.sharma     (engagement bon, stable)              ║");
  console.log("║    · kevin.legrand    (engagement moyen, en progression)    ║");
  console.log("║    · fatou.diallo     (engagement bon, stable)              ║");
  console.log("║    · romain.garcia    (engagement faible, en progression)   ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Habitudes globales publiques (admin) :                      ║");
  console.log("║    · Méditation du matin    · 8 verres d'eau                ║");
  console.log("║    · Lecture quotidienne    · 10 000 pas                    ║");
  console.log("║    · Bilan hebdomadaire     · 5 min de reconnaissance       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

const isMain = process.argv[1]?.includes("seed-full-year");
if (isMain) {
  seedFullYear()
    .then(() => { console.log("✅ Seed 1 an terminé.\n"); process.exit(0); })
    .catch(err => { console.error("❌ Seed échoué :", err); process.exit(1); });
}
