const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const Role = require("./models/Role");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1/habitflow";

async function createUser() {
  await mongoose.connect(MONGO_URI);

  let userRole = await Role.findOne({ nom: "user" });
  if (!userRole) {
    userRole = await Role.create({ nom: "user", description: "Utilisateur standard", permissions: ["HABITS_VIEW", "HABITS_CREATE", "LOGS_MANAGE", "PROGRESS_VIEW"] });
    console.log("Rôle user créé");
  }

  const email = "utilisateur@habitflow.com";
  const password = "User123!";
  const nom = "Test";
  const prenom = "User";

  let existing = await User.findOne({ email });
  if (existing) {
    console.log("Un compte avec cet email existe déjà.");
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    nom,
    prenom,
    email,
    mot_de_passe: hashed,
    role: userRole._id,
    isActive: true,
  });
  console.log("\n✅ Compte utilisateur créé avec succès !");
  console.log("\n📧 Email     : " + email);
  console.log("🔑 Mot de passe : " + password);
  console.log("👤 Nom      : " + prenom + " " + nom);
  console.log("\nConnecte-toi sur http://localhost:3000/login\n");
  process.exit(0);
}

createUser().catch(err => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
