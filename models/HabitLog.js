const mongoose = require("mongoose");
const habitLogSchema = new mongoose.Schema(
  {
    habit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    utilisateur_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: { type: Date, required: true },
    statut: { type: String, enum: ["completee", "non_completee", "partielle", "manquee"], required: true },
    notes: { type: String },
    photo_url: { type: String }, // Photo de vérification
    retroactif: { type: Boolean, default: false },
    duree_realisation: { type: Number },
    // Catch-up / Rattrapage fields
    justification: { type: String }, // Raison du rattrapage
    justification_date: { type: Date }, // Quand le rattrapage a été saisi
  },
  { timestamps: true }
);
module.exports = mongoose.model("HabitLog", habitLogSchema);
