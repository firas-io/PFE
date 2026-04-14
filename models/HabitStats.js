const mongoose = require("mongoose");

const habitStatsSchema = new mongoose.Schema(
  {
    habit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      unique: true,
    },

    streak_actuel: { type: Number, default: 0 },
    meilleur_streak: { type: Number, default: 0 },

    taux_completion: { type: Number, default: 0 },

    derniere_mise_a_jour: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("HabitStats", habitStatsSchema);
