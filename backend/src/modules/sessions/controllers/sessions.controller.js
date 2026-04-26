import { Sessions }   from "../models/Session.model.js";
import { createError } from "@/core/errors.js";

const _handle = fn => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || 500).send({ code: err.code, message: err.message }); }
};

export const createSession = _handle(async (req, reply) => {
  reply.code(201).send(await Sessions.insertOne({ ...req.body, user_id: req.user.id }));
});

export const getSessions = _handle(async (req, reply) => {
  const isAdmin = req.user.permissions.includes("ALL") || req.user.permissions.includes("SESSIONS_MANAGE");
  const filter  = isAdmin ? {} : { user_id: req.user.id };
  reply.send(await Sessions.find(filter));
});

export const deleteSession = _handle(async (req, reply) => {
  const session = await Sessions.findById(req.params.id);
  if (!session) throw createError(404, "Session not found");

  const isAdmin = req.user.permissions.includes("SESSIONS_MANAGE") || req.user.permissions.includes("ALL");
  if (session.user_id !== req.user.id && !isAdmin) throw createError(403, "Accès refusé");

  await Sessions.deleteOne({ _id: req.params.id });
  reply.code(204).send(null);
});
