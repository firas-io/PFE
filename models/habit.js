const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    utilisateur_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nom: { type: String, required: true },
    description: { type: String },
    categorie: { type: String },
    frequence: { type: String, enum: ["daily", "weekly", "monthly"] },
    date_creation: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Habit", habitSchema);
