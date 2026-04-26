import * as svc from "../services/progress.service.js";

const _handle = fn => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || 500).send({ code: err.code, message: err.message }); }
};

export const getMyProgress = _handle(async (req, reply) => { reply.send(await svc.getMyProgress(req.user.id)); });
export const getToday      = _handle(async (req, reply) => { reply.send(await svc.getToday(req.user.id)); });
export const getCalendar   = _handle(async (req, reply) => {
  const dateParam = typeof req.query.date === "string" ? req.query.date : null;
  reply.send(await svc.getCalendar(req.user.id, dateParam));
});
