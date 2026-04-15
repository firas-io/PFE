const mongoose = require("mongoose");

const habitNoteHistorySchema = new mongoose.Schema(
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
    old_note: { type: String }, // Previous note value
    new_note: { type: String }, // New note value
    action: { type: String, enum: ["created", "updated", "deleted"], default: "updated" },
    note_text: { type: String }, // The note content that was changed
  },
  { timestamps: true }
);

module.exports = mongoose.model("HabitNoteHistory", habitNoteHistorySchema);
