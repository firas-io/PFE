const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { authenticateUser } = require("../lib/ldap");


exports.register = async (req, reply) => {
  try {
    const { mot_de_passe, nom, prenom, email } = req.body;
    
    // Validation
    if (!email || !mot_de_passe || !nom || !prenom) {
      return reply.code(400).send({ error: "All fields are required" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.code(400).send({ error: "Email already in use" });
    }
    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    // Récupérer ou créer le rôle "utilisateur" par défaut
    let userRole = await Role.findOne({ nom: "utilisateur" });
    if (!userRole) {
      userRole = await Role.create({
        nom: "utilisateur",
        description: "Rôle utilisateur par défaut",
        permissions: ["HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE", "LOGS_VIEW", "LOGS_MANAGE", "PROGRESS_VIEW", "ONBOARDING_VIEW", "REMINDERS_VIEW", "SESSIONS_VIEW", "SELF_VIEW", "SELF_EDIT"]
      });
    }
    
    const user = await User.create({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      role: userRole._id
    });
    
    reply.code(201).send({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Register error:", err);
    reply.code(400).send({ error: err.message });
  }
};
exports.login = async (req, reply) => {
  try {
    const { email, mot_de_passe } = req.body;
    
    if (!email || !mot_de_passe) {
      return reply.code(400).send({ error: "Email and password required" });
    }
    
    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return reply.code(403).send({ error: "User deactivated" });
    }

    if (!user.role) {
      console.error("User has no role:", user);
      return reply.code(500).send({ error: "User role not configured" });
    }
    
    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const token = await reply.jwtSign({
      id: user._id.toString(),
      email: user.email,
      role: user.role.nom,
      permissions: user.role.permissions || []
    });
    
    reply.send({ 
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role.nom,
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    reply.code(500).send({ error: err.message });
  }
};

exports.loginLdap = async (req, reply) => {
  try {
    if (String(process.env.LDAP_ENABLED || "false").toLowerCase() !== "true") {
      return reply.code(501).send({ error: "LDAP authentication disabled" });
    }

    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return reply.code(400).send({ error: "Email and password required" });
    }

    const result = await authenticateUser({ username: email, password: mot_de_passe });
    if (!result.ok) {
      console.error("LDAP auth failed:", {
        reason: result.reason,
        error: result.error && result.error.message
      });
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    // Ensure default role exists
    let userRole = await Role.findOne({ nom: "utilisateur" });
    if (!userRole) {
      userRole = await Role.create({
        nom: "utilisateur",
        description: "Rôle utilisateur par défaut",
        permissions: ["HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE", "LOGS_VIEW", "LOGS_MANAGE", "PROGRESS_VIEW", "ONBOARDING_VIEW", "REMINDERS_VIEW", "SESSIONS_VIEW", "SELF_VIEW", "SELF_EDIT"]
      });
    }

    // Check if admin role exists for admin@habitflow.local
    let assignedRole = userRole;
    if (email === "admin@habitflow.local") {
      let adminRole = await Role.findOne({ nom: "admin" });
      if (!adminRole) {
        adminRole = await Role.create({
          nom: "admin",
          description: "Accès total",
          permissions: ["ALL"]
        });
      }
      assignedRole = adminRole;
    }

    // Upsert user in Mongo on first LDAP login
    const ldapUser = result.user;
    const prenom = ldapUser.givenName || (ldapUser.cn ? String(ldapUser.cn).split(" ")[0] : "LDAP");
    const nom = ldapUser.sn || (ldapUser.cn ? String(ldapUser.cn).split(" ").slice(1).join(" ") : "User");

    let user = await User.findOne({ email }).populate("role");
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashed = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        nom,
        prenom,
        email,
        mot_de_passe: hashed,
        role: assignedRole._id,
        dernier_login: new Date()
      });
      user = await User.findById(user._id).populate("role");
    } else {
      user.dernier_login = new Date();
      if (!user.role) user.role = assignedRole._id;
      await user.save();
      user = await User.findById(user._id).populate("role");
    }

    if (!user.isActive) {
      return reply.code(403).send({ error: "User deactivated" });
    }

    if (!user.role) {
      return reply.code(500).send({ error: "User role not configured" });
    }

    const token = await reply.jwtSign({
      id: user._id.toString(),
      email: user.email,
      role: user.role.nom,
      permissions: user.role.permissions || []
    });

    reply.send({
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role.nom
      }
    });
  } catch (err) {
    console.error("LDAP login error:", err);
    reply.code(500).send({ error: err.message });
  }
};