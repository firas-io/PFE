const mongoose = require("mongoose");

const habitLogSchema = new mongoose.Schema(
  {
    habit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    date: { type: Date, required: true },
    statut: { type: String, enum: ["completee", "non_completee", "partielle"], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HabitLog", habitLogSchema);
