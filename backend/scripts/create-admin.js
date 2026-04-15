const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const Role = require("./models/Role");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1/habitflow";

async function createAdmin() {
  await mongoose.connect(MONGO_URI);

  let adminRole = await Role.findOne({ nom: "admin" });
  if (!adminRole) {
    adminRole = await Role.create({ nom: "admin", description: "Accès total", permissions: ["ALL"] });
    console.log("Rôle admin créé");
  }

  const email = "admin@habitflow.com";
  const password = "Admin123!";
  const nom = "Admin";
  const prenom = "System";

  let existing = await User.findOne({ email });
  if (existing) {
    console.log("Un compte admin existe déjà.");
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    nom,
    prenom,
    email,
    mot_de_passe: hashed,
    role: adminRole._id,
    isActive: true,
  });
  console.log("Compte administrateur créé :", email);
  process.exit(0);
}

createAdmin();
