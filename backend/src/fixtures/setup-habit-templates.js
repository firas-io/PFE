import { HabitTemplates } from "@/modules/habit-templates/models/HabitTemplate.model.js";

const DEFAULT_TEMPLATES = [
  {
    nom_template: "10 000 pas",
    description: "Marcher pour atteindre une cible quotidienne.",
    categorie: "sport",
    priorite: "medium",
    frequence: "daily",
    horaires_cibles: ["matin"],
    objectif_valeur: 10000,
    objectif_unite: "pas"
  },
  {
    nom_template: "Lecture 20 minutes",
    description: "Lire 20 minutes chaque jour pour progresser.",
    categorie: "apprentissage",
    priorite: "medium",
    frequence: "daily",
    horaires_cibles: ["soir"],
    objectif_valeur: 20,
    objectif_unite: "minutes"
  },
  {
    nom_template: "Méditation 10 minutes",
    description: "Se recentrer et réduire le stress.",
    categorie: "bien_etre",
    priorite: "high",
    frequence: "daily",
    horaires_cibles: ["matin"],
    objectif_valeur: 10,
    objectif_unite: "minutes"
  },
  {
    nom_template: "Sport 3x par semaine",
    description: "Maintenir une routine sportive régulière.",
    categorie: "sport",
    priorite: "high",
    frequence: "times_per_week",
    fois_par_semaine: 3,
    horaires_cibles: ["soir"]
  },
  {
    nom_template: "Planification hebdomadaire",
    description: "Prévoir les objectifs de la semaine.",
    categorie: "travail",
    priorite: "low",
    frequence: "specific_days",
    jours_specifiques: ["lundi"],
    horaires_cibles: ["midi"]
  }
];

export async function setupHabitTemplates(fastify) {
  try {
    for (const tpl of DEFAULT_TEMPLATES) {
      const existing = await HabitTemplates.findOne({ nom_template: tpl.nom_template });
      if (!existing) {
        await HabitTemplates.insertOne(tpl);
        fastify?.log?.info?.(`Habit template created: ${tpl.nom_template}`);
      }
    }
  } catch (err) {
    fastify?.log?.error?.("setupHabitTemplates error: " + err.message);
    console.error("setupHabitTemplates full error:", err);
  }
}
