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
    statut: {
      type: String,
      enum: ["completee", "non_completee", "partielle", "manquee"],
      required: true,
    },
    notes: { type: String },
    photo_url: { type: String },
    retroactif: { type: Boolean, default: false },
    duree_realisation: { type: Number },
    justification: { type: String },
    justification_date: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HabitLog", habitLogSchema);
