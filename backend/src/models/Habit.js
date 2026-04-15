const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    utilisateur_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // "nom" est le champ historique; on accepte "titre" côté API et on le mappe vers "nom".
    nom: { type: String, required: true },

    // Champs optionnels pour enrichir la gestion côté front.
    description: { type: String },

    // Catégorie (valeurs canoniques stockées)
    categorie: {
      type: String,
      enum: ["sante", "travail", "apprentissage", "bien_etre", "sport", "autre"]
    },

    // Statut de l'habitude (archivage = soft delete logique)
    statut: {
      type: String,
      enum: ["active", "pause", "archived"],
      default: "active"
    },
    date_archivage: { type: Date },

    // Priorité
    priorite: {
      type: String,
      enum: ["high", "medium", "low"]
    },

    // Dates spécifiques pour afficher l'habitude
    dates_specifiques: {
      type: [Date],
      default: []
    },

    // Fréquence : mode canonique + détails
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

    // Horaires cibles
    horaires_cibles: {
      type: [String],
      enum: ["matin", "midi", "soir"]
    },
    heure_precise: { type: String }, // ex: "09:30" (validation légère côté API)

    // Objectif quantifiable optionnel (ex: "20 minutes", "10 000 pas")
    objectif_valeur: { type: Number },
    objectif_unite: { type: String }, // ex: "minutes", "pas"
    objectif_detail: { type: String },

    // Si true (défini par un admin), l’habitude apparaît aussi chez les autres utilisateurs (GET /habits/my).
    visible_pour_tous: { type: Boolean, default: false },
    // Note utilisateur
    note: { type: String },
    // Date de début de l'habitude
    date_debut: { type: Date },
    date_creation: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Habit", habitSchema);
