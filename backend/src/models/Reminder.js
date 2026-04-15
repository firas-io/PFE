const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    habit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },

    utilisateur_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    heure_rappel: { type: String, required: true },

    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);
