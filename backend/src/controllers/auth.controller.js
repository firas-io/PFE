/**
 * auth.controller.js
 * Handles user registration, local login, and LDAP login.
 * Renamed from authentificationControllers.js for clarity.
 */
const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { authenticateUser } = require("../config/ldap");

exports.register = async (req, reply) => {
  try {
    const { mot_de_passe, nom, prenom, email } = req.body;

    if (!email || !mot_de_passe || !nom || !prenom) {
      return reply.code(400).send({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.code(400).send({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Always use the role created by setupAdmin — never create it inline
    // with a potentially different permission set.
    const userRole = await Role.findOne({ nom: "utilisateur" });
    if (!userRole) {
      return reply.code(500).send({ error: "Default role not initialised — restart the server." });
    }

    await User.create({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      role: userRole._id
    });

    // Return minimal info — never expose mot_de_passe (even hashed)
    reply.code(201).send({
      message: "User registered successfully",
      user: { nom, prenom, email, role: userRole.nom }
    });
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

    // Roles are guaranteed to exist after setupAdmin() runs at startup.
    // Never create them inline — that would produce divergent permission sets.
    const userRole = await Role.findOne({ nom: "utilisateur" });
    if (!userRole) {
      return reply.code(500).send({ error: "Default role not initialised — restart the server." });
    }

    // LDAP admin gets the "admin" role (admin@habitflow.local is the LDAP seed admin)
    let assignedRole = userRole;
    if (email === process.env.LDAP_ADMIN_EMAIL || email === "admin@habitflow.local") {
      const adminRole = await Role.findOne({ nom: "admin" });
      if (adminRole) assignedRole = adminRole;
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

exports.getProfile = async (request) => {
  return request.user;
};
