/**
 * onboarding.controller.js
 * Business logic for onboarding management.
 * Extracted from onboardingRoutes.js
 */
const Onboarding = require("../models/Onboarding");

// POST /onboarding — Authenticated (owner)
exports.createOnboarding = async (req, reply) => {
  try {
    const onboardingData = { ...req.body, utilisateur_id: req.user.id };
    const onboarding = await Onboarding.create(onboardingData);
    reply.code(201);
    return onboarding;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};

// GET /onboarding — Admin only (Permission: ONBOARDING_VIEW)
exports.getOnboardings = async (req, reply) => {
  try {
    const allOnboarding = await Onboarding.find().populate("utilisateur_id", "-mot_de_passe");
    return allOnboarding;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// GET /onboarding/:id — Owner or Admin
exports.getOnboardingById = async (req, reply) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id).populate("utilisateur_id", "-mot_de_passe");
    if (!onboarding) {
      reply.code(404);
      return { error: "Onboarding not found" };
    }

    const isAdmin = req.user.permissions.includes("ONBOARDING_VIEW") || req.user.permissions.includes("ALL");
    if (onboarding.utilisateur_id._id.toString() !== req.user.id && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    return onboarding;
  } catch (err) {
    reply.code(500);
    return { error: err.message };
  }
};

// PUT /onboarding/:id — Owner or Admin
exports.updateOnboarding = async (req, reply) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) {
      reply.code(404);
      return { error: "Onboarding not found" };
    }

    const isAdmin = req.user.permissions.includes("ONBOARDING_MANAGE") || req.user.permissions.includes("ALL");
    if (onboarding.utilisateur_id.toString() !== req.user.id && !isAdmin) {
      reply.code(403);
      return { error: "Accès refusé" };
    }

    const updatedOnboarding = await Onboarding.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return updatedOnboarding;
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
};
