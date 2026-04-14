const mongoose = require("mongoose");
const User = require("./models/User");
const Role = require("./models/Role");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1/habitflow";

async function listUsers() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({}).populate('role');
  console.log("Utilisateurs dans la base :");
  users.forEach(u => {
    const roleName = u.role && u.role.nom ? u.role.nom : u.role;
    console.log(u.email, u.nom, u.prenom, roleName, u.isActive);
  });
  process.exit(0);
}

listUsers();
