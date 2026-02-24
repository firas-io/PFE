const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema(
  {
    utilisateur_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  
    etape_completee: { type: Boolean, default: false },
    date_debut: { type: Date, default: Date.now},
    date_fin: { type: Date},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Onboarding", onboardingSchema);
