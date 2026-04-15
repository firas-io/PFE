const mongoose = require("mongoose");

const habitTemplateSchema = new mongoose.Schema(
  {
    nom_template: { type: String, required: true, unique: true },
    description: { type: String },

    categorie: {
      type: String,
      enum: ["sante", "travail", "apprentissage", "bien_etre", "sport", "autre"]
    },
    priorite: { type: String, enum: ["high", "medium", "low"] },

    frequence: {
      type: String,
      enum: ["daily", "weekly", "monthly", "specific_days", "times_per_week"],
      default: "daily"
    },
    jours_specifiques: {
      type: [
        {
          type: String,
          enum: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
        }
      ]
    },
    fois_par_semaine: { type: Number, min: 1, max: 7 },

    horaires_cibles: {
      type: [String],
      enum: ["matin", "midi", "soir"]
    },
    heure_precise: { type: String },

    objectif_valeur: { type: Number },
    objectif_unite: { type: String },
    objectif_detail: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("HabitTemplate", habitTemplateSchema);

