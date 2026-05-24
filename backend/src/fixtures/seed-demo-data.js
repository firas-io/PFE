/**
 * Reset MongoDB et alimente 6 mois de données réalistes.
 * 3 managers, 15 utilisateurs (5 par équipe), habitudes + logs.
 *
 * CLI (depuis backend/) :
 *   node --import ./src/loader.js src/fixtures/seed-demo-data.js
 *
 * MONGO_URI par défaut : mongodb://127.0.0.1:27018/habitflow (Docker)
 */
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { MongoDBManager } from "../core/mongo.connect.js";
import { CATEGORIES } from "../shared/constants/categories.js";
import { SYSTEM_ARCHIVED_USER_ID } from "../modules/users/constants/users.constants.js";

const MONTHS_BACK = 6;
const PASSWORD_PLACEHOLDER = "LDAP_ONLY";

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
  { email: "sophie.martin@habitflow.local", firstName: "Sophie", lastName: "Martin", department: "Bien-être & Productivité", monthsAgo: 6 },
  { email: "karim.amine@habitflow.local",    firstName: "Karim",  lastName: "Amine",    department: "Tech & Apprentissage",      monthsAgo: 6 },
  { email: "claire.dubois@habitflow.local",  firstName: "Claire", lastName: "Dubois",   department: "Opérations & Santé",        monthsAgo: 5 },
];

const TEAM_MEMBERS = {
  "sophie.martin@habitflow.local": [
    { email: "ali.ben@habitflow.local",         firstName: "Ali",     lastName: "Ben",     monthsAgo: 6,  engagement: 0.78, improving: true  },
    { email: "sara.kim@habitflow.local",        firstName: "Sara",    lastName: "Kim",     monthsAgo: 5,  engagement: 0.85, improving: false },
    { email: "yassine.rahim@habitflow.local",   firstName: "Yassine", lastName: "Rahim",   monthsAgo: 5,  engagement: 0.62, improving: true  },
    { email: "maya.zidane@habitflow.local",     firstName: "Maya",    lastName: "Zidane",  monthsAgo: 4,  engagement: 0.71, improving: false },
    { email: "lucas.renard@habitflow.local",    firstName: "Lucas",   lastName: "Renard",  monthsAgo: 3,  engagement: 0.55, improving: true  },
  ],
  "karim.amine@habitflow.local": [
    { email: "omar.said@habitflow.local",       firstName: "Omar",    lastName: "Said",      monthsAgo: 6,  engagement: 0.82, improving: false },
    { email: "lina.martin@habitflow.local",     firstName: "Lina",    lastName: "Martin",    monthsAgo: 5,  engagement: 0.74, improving: true  },
    { email: "nora.haddad@habitflow.local",     firstName: "Nora",    lastName: "Haddad",    monthsAgo: 5,  engagement: 0.68, improving: false },
    { email: "adam.faris@habitflow.local",      firstName: "Adam",    lastName: "Faris",     monthsAgo: 4,  engagement: 0.58, improving: true  },
    { email: "ines.bouazizi@habitflow.local",   firstName: "Ines",    lastName: "Bouazizi",  monthsAgo: 2,  engagement: 0.48, improving: true  },
  ],
  "claire.dubois@habitflow.local": [
    { email: "emma.leroy@habitflow.local",      firstName: "Emma",    lastName: "Leroy",     monthsAgo: 6,  engagement: 0.80, improving: false },
    { email: "thomas.petit@habitflow.local",    firstName: "Thomas",  lastName: "Petit",     monthsAgo: 5,  engagement: 0.66, improving: true  },
    { email: "lei.wang@habitflow.local",        firstName: "Lei",     lastName: "Wang",      monthsAgo: 4,  engagement: 0.72, improving: false },
    { email: "fatima.elami@habitflow.local",    firstName: "Fatima",  lastName: "El Ami",    monthsAgo: 3,  engagement: 0.59, improving: true  },
    { email: "hugo.navarro@habitflow.local",    firstName: "Hugo",    lastName: "Navarro",   monthsAgo: 2,  engagement: 0.64, improving: false },
  ],
};

const HABIT_POOL = [
  { nom: "Course matinale",           categorie: "sport",          frequence: "daily" },
  { nom: "Musculation",               categorie: "sport",          frequence: "weekly" },
  { nom: "Yoga du soir",              categorie: "sport",          frequence: "daily" },
  { nom: "Boire 2L d'eau",            categorie: "sante",          frequence: "daily" },
  { nom: "Prise de vitamines",        categorie: "sante",          frequence: "daily" },
  { nom: "Méditation 10 min",         categorie: "bien_etre",      frequence: "daily" },
  { nom: "Journal de gratitude",      categorie: "bien_etre",      frequence: "daily" },
  { nom: "Lecture 30 minutes",        categorie: "apprentissage",  frequence: "daily" },
  { nom: "Cours d'anglais",           categorie: "apprentissage",  frequence: "weekly" },
  { nom: "Revue des emails",          categorie: "travail",        frequence: "daily" },
  { nom: "Planification de la journée", categorie: "travail",    frequence: "daily" },
  { nom: "Marche après le déjeuner",  categorie: "sport",          frequence: "daily" },
];

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

function addMonths(date, delta) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - delta);
  return d;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return x;
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

function pickHabitsForUser(rand, count = 4) {
  const shuffled = [...HABIT_POOL].sort(() => rand() - 0.5);
  return shuffled.slice(0, count + Math.floor(rand() * 2));
}

function completionChance({ engagement, improving, dayIndex, totalDays, isWeekend, categorie }) {
  let p = engagement;
  if (improving) p += 0.15 * (dayIndex / Math.max(totalDays, 1));
  if (isWeekend && (categorie === "travail" || categorie === "apprentissage")) p *= 0.55;
  if (isWeekend && categorie === "sport") p *= 1.08;
  return Math.min(0.92, Math.max(0.12, p));
}

async function wipeDatabase(db) {
  const name = db.databaseName;
  await db.dropDatabase();
  console.log(`🗑️  Base "${name}" supprimée.`);
}

async function seedRoles(db) {
  const col = db.collection("roles");
  const docs = DEFAULT_ROLES.map(r => ({ _id: uuid(), ...r, createdAt: new Date(), updatedAt: new Date() }));
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
  const col = db.collection("users");
  const hash = await bcrypt.hash(PASSWORD_PLACEHOLDER, 10);
  const now  = new Date();
  const byEmail = {};

  const adminDoc = {
    _id: uuid(),
    firstName: "Admin",
    lastName: "System",
    email: "admin@habitflow.local",
    passwordHash: hash,
    role_id: roleIds.admin,
    department: "Direction",
    isActive: true,
    isFirstLogin: false,
    categories: ["sport", "bien_etre", "travail"],
    createdAt: addMonths(now, 6),
    updatedAt: now,
    first_login_at: addMonths(now, 6),
  };
  byEmail[adminDoc.email] = adminDoc;

  const managerDocs = [];
  for (const m of MANAGERS) {
    const doc = {
      _id: uuid(),
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      passwordHash: hash,
      role_id: roleIds.manager,
      manager_id: null,
      department: m.department,
      isActive: true,
      isFirstLogin: false,
      categories: ["sport", "travail", "bien_etre"],
      createdAt: addMonths(now, m.monthsAgo),
      updatedAt: now,
      first_login_at: addMonths(now, m.monthsAgo),
    };
    managerDocs.push(doc);
    byEmail[doc.email] = doc;
  }

  const memberDocs = [];
  for (const mgr of MANAGERS) {
    const manager = byEmail[mgr.email];
    for (const u of TEAM_MEMBERS[mgr.email]) {
      const doc = {
        _id: uuid(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        passwordHash: hash,
        role_id: roleIds.utilisateur,
        manager_id: manager._id,
        department: mgr.department,
        isActive: true,
        isFirstLogin: false,
        categories: ["sport", "sante", "bien_etre"],
        createdAt: addMonths(now, u.monthsAgo),
        updatedAt: now,
        first_login_at: addMonths(now, u.monthsAgo),
        _engagement: u.engagement,
        _improving: u.improving,
      };
      memberDocs.push(doc);
      byEmail[doc.email] = doc;
    }
  }

  await col.insertOne({
    _id: SYSTEM_ARCHIVED_USER_ID,
    firstName: "Archived",
    lastName: "[System]",
    email: "system-archived@habitflow.internal",
    passwordHash: null,
    role_id: roleIds.utilisateur,
    department: "",
    isActive: false,
    anonymized: true,
    is_system: true,
    createdAt: now,
    updatedAt: now,
  });

  await col.insertMany([adminDoc, ...managerDocs, ...memberDocs]);
  console.log(`✅ ${1 + managerDocs.length + memberDocs.length} utilisateurs créés (+ compte système).`);
  return { byEmail, members: memberDocs, managers: managerDocs };
}

async function seedHabits(db, members) {
  const col = db.collection("habits");
  const habits = [];
  const now = new Date();

  for (const user of members) {
    const rand = mulberry32(user.email.length * 997);
    const picks = pickHabitsForUser(rand, 4);
    for (const tpl of picks) {
      const created = new Date(user.createdAt);
      created.setDate(created.getDate() + Math.floor(rand() * 14));
      habits.push({
        _id: uuid(),
        nom: tpl.nom,
        description: `Habitude suivie par ${user.firstName}`,
        categorie: tpl.categorie,
        frequence: tpl.frequence,
        statut: rand() > 0.08 ? "active" : "pause",
        priorite: rand() > 0.6 ? "medium" : "high",
        user_id: user._id,
        visible_pour_tous: false,
        is_global: false,
        date_debut: created,
        createdAt: created,
        updatedAt: now,
        _owner: user,
      });
    }
  }

  await col.insertMany(habits.map(({ _owner, ...h }) => h));
  console.log(`✅ ${habits.length} habitudes créées.`);
  return habits;
}

async function seedLogs(db, habits, periodStart, periodEnd) {
  const col = db.collection("habit-logs");
  const logs = [];
  const days = eachDay(periodStart, periodEnd);

  for (const habit of habits) {
    const user = habit._owner;
    const rand = mulberry32((user.email + habit.nom).length * 131);
    const habitStart = new Date(Math.max(
      new Date(habit.date_debut).getTime(),
      new Date(user.createdAt).getTime(),
      periodStart.getTime()
    ));

    const eligibleDays = days.filter(d => d >= habitStart);
    const totalDays = eligibleDays.length;

    eligibleDays.forEach((day, dayIndex) => {
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const p = completionChance({
        engagement: user._engagement,
        improving: user._improving,
        dayIndex,
        totalDays,
        isWeekend,
        categorie: habit.categorie,
      });

      if (rand() > p + 0.08) return;

      const roll = rand();
      let statut = "completee";
      if (roll > p) statut = "non_completee";
      else if (roll < 0.04) statut = "manquee";

      logs.push({
        _id: uuid(),
        habit_id: habit._id,
        user_id: user._id,
        date: startOfDay(day),
        statut,
        createdAt: startOfDay(day),
        updatedAt: startOfDay(day),
      });
    });
  }

  const BATCH = 800;
  for (let i = 0; i < logs.length; i += BATCH) {
    await col.insertMany(logs.slice(i, i + BATCH));
  }
  console.log(`✅ ${logs.length} logs d'habitudes créés (${MONTHS_BACK} mois).`);
}

export async function seedDemoData() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27018/habitflow";
  const client = await MongoDBManager.connect(uri);
  const db = client.db();

  const periodEnd   = new Date();
  const periodStart = addMonths(periodEnd, MONTHS_BACK);
  periodStart.setHours(0, 0, 0, 0);

  console.log("\n🌱 HabitFlow — seed démo (6 mois)\n");
  console.log(`   MongoDB : ${uri}`);
  console.log(`   Période : ${periodStart.toISOString().slice(0, 10)} → ${periodEnd.toISOString().slice(0, 10)}\n`);

  await wipeDatabase(db);
  const roleIds = await seedRoles(db);
  await seedCategories(db);
  const { members, managers } = await seedUsers(db, roleIds);
  const allHabitOwners = [
    ...members,
    ...managers.map(m => ({ ...m, _engagement: 0.76, _improving: false })),
  ];
  const habits = await seedHabits(db, allHabitOwners);
  await seedLogs(db, habits, periodStart, periodEnd);

  await MongoDBManager.closeAll();

  console.log("\n📋 Comptes LDAP (connexion avec LDAP activé) :\n");
  console.log("   Admin     : admin@habitflow.local / Admin123!");
  console.log("   Managers  : *@habitflow.local       / Manager123!");
  console.log("   Users     : *@habitflow.local       / User123!\n");
  console.log("   Équipe Sophie : ali.ben, sara.kim, yassine.rahim, maya.zidane, lucas.renard");
  console.log("   Équipe Karim  : omar.said, lina.martin, nora.haddad, adam.faris, ines.bouazizi");
  console.log("   Équipe Claire : emma.leroy, thomas.petit, lei.wang, fatima.elami, hugo.navarro\n");
}

const isMain = process.argv[1]?.includes("seed-demo-data");
if (isMain) {
  seedDemoData()
    .then(() => { console.log("✅ Seed terminé.\n"); process.exit(0); })
    .catch(err => { console.error("❌ Seed échoué:", err); process.exit(1); });
}
