import { Onboardings } from "../models/Onboarding.model.js";
import { Users }       from "@/modules/users/models/User.model.js";
import { createError }  from "@/core/errors.js";
import { CATEGORY_SLUGS } from "@/shared/constants/categories.js";

const _handle = fn => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || 500).send({ code: err.code, message: err.message }); }
};

export const createOnboarding = _handle(async (req, reply) => {
  reply.code(201).send(await Onboardings.insertOne({ ...req.body, user_id: req.user.id }));
});

export const getOnboardings = _handle(async (req, reply) => {
  const isAdmin = req.user.permissions.includes("ALL") || req.user.permissions.includes("ONBOARDING_MANAGE");
  const filter  = isAdmin ? {} : { user_id: req.user.id };
  reply.send(await Onboardings.find(filter));
});

export const getOnboardingById = _handle(async (req, reply) => {
  const onboarding = await Onboardings.findById(req.params.id);
  if (!onboarding) throw createError(404, "Onboarding not found");

  const isAdmin = req.user.permissions.includes("ONBOARDING_VIEW") || req.user.permissions.includes("ALL");
  if (onboarding.user_id !== req.user.id && !isAdmin) throw createError(403, "Accès refusé");

  reply.send(onboarding);
});

export const updateOnboarding = _handle(async (req, reply) => {
  const onboarding = await Onboardings.findById(req.params.id);
  if (!onboarding) throw createError(404, "Onboarding not found");

  const isAdmin = req.user.permissions.includes("ONBOARDING_MANAGE") || req.user.permissions.includes("ALL");
  if (onboarding.user_id !== req.user.id && !isAdmin) throw createError(403, "Accès refusé");

  reply.send(await Onboardings.updateOne({ _id: req.params.id }, { $set: req.body }));
});

export const saveCategories = _handle(async (req, reply) => {
  const userId = req.user.id;
  const { categories } = req.body ?? {};

  if (!Array.isArray(categories) || categories.length === 0)
    throw createError(400, "At least one category is required");

  const invalid = categories.filter((c) => !CATEGORY_SLUGS.includes(c));
  if (invalid.length > 0)
    throw createError(400, `Unknown categories: ${invalid.join(", ")}`);

  // Persist categories and clear first-login flag on the user document
  await Users.updateOne(
    { _id: userId },
    { $set: { categories, isFirstLogin: false } }
  );

  // Mark the onboarding record as completed
  const onboarding = await Onboardings.findOne({ user_id: userId });
  if (onboarding) {
    await Onboardings.updateOne(
      { _id: onboarding._id },
      { $set: { completed: true, status: "completed", categories } }
    );
  } else {
    await Onboardings.insertOne({
      user_id: userId,
      status: "completed",
      completed: true,
      categories,
    });
  }

  reply.code(200).send({ message: "Onboarding completed", categories });
});
