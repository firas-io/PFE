import { StatusCodes as httpStatus } from "http-status-codes";
import HabitTemplatesService from "../services/habit-templates.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({ code: err.code, message: err.message }); }
};

const getTemplates       = _h(async (_req, reply) => { reply.send(await HabitTemplatesService.getTemplates()); });
const createFromTemplate = _h(async (req, reply)  => {
  reply.send(await HabitTemplatesService.createFromTemplate(req.params.templateId, req.body, req.user.id, req));
});

const HabitTemplatesController = { getTemplates, createFromTemplate };
export default HabitTemplatesController;
