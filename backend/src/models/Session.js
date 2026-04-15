const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    utilisateur_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    token: { type: String, required: true },

    expiration: { type: Date, required: true },
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
