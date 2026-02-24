const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    departement: { type: String },
    role: { type: String, enum: ["utilisateur", "admin"], default: "utilisateur"},
    mot_de_passe: { type: String, required: true },
    date_creation: { type: Date, default: Date.now },
    dernier_login: { type: Date},
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
