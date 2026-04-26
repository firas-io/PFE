import { StatusCodes as httpStatus } from "http-status-codes";
import HabitsService  from "../services/habits.service.js";
import StreaksService from "@/modules/streaks/streaks.service.js";

const _h = (fn) => async (req, reply) => {
  try   { return await fn(req, reply); }
  catch (err) { reply.code(err.statusCode || httpStatus.BAD_REQUEST).send({ code: err.code, message: err.message }); }
};

// Not wrapped in _h — needs to forward err.conflicts on HABIT-006 off-day violations.
const createHabit = async (req, reply) => {
  try {
    reply.code(httpStatus.CREATED).send(await HabitsService.createHabit(req.body, req.user.id, req));
  } catch (err) {
    const body = { code: err.code, message: err.message };
    if (err.conflicts) body.conflicts = err.conflicts;
    reply.code(err.statusCode || httpStatus.BAD_REQUEST).send(body);
  }
};

// Not wrapped in _h — needs to forward err.conflicts on HABIT-006 off-day violations.
const updateHabit = async (req, reply) => {
  try {
    reply.send(await HabitsService.updateHabit(req.params.id, req.body, req.user.id, req));
  } catch (err) {
    const body = { code: err.code, message: err.message };
    if (err.conflicts) body.conflicts = err.conflicts;
    reply.code(err.statusCode || httpStatus.BAD_REQUEST).send(body);
  }
};

const getAllHabits        = _h(async (req, reply) => { reply.send(await HabitsService.getAllHabits(req.query)); });
const getMyHabits        = _h(async (req, reply) => { reply.send(await HabitsService.getMyHabits(req.user.id, req.query)); });
const getHabitById       = _h(async (req, reply) => { reply.send(await HabitsService.getHabitById(req.params.id, req.user.id, req.user.permissions)); });
const updateHabitStatus  = _h(async (req, reply) => { reply.send(await HabitsService.updateHabitStatus(req.params.id, req.body, req.user.id, req.user.permissions)); });
const updateHabitNotes   = _h(async (req, reply) => { reply.send(await HabitsService.updateHabitNotes(req.params.id, req.body, req.user.id)); });
const getNoteHistory     = _h(async (req, reply) => { reply.send(await HabitsService.getNoteHistory(req.params.id, req.user.id, req.user.permissions)); });
const cloneHabit         = _h(async (req, reply) => { reply.code(httpStatus.CREATED).send(await HabitsService.cloneHabit(req.params.id, req.body, req.user.id, req)); });

const archiveHabit = _h(async (req, reply) => {
  await HabitsService.archiveHabit(req.params.id, req.user.id, req.user.permissions);
  reply.code(httpStatus.NO_CONTENT).send(null);
});

// Not wrapped in _h — needs to forward err.partial on HABIT-005 partial failures.
const deleteHabit = async (req, reply) => {
  try {
    const result = await HabitsService.deleteHabitCascade(req.params.id, req.user.id, req.user.permissions);
    reply.code(httpStatus.OK).send(result);
  } catch (err) {
    const body = { code: err.code, message: err.message };
    if (err.partial) body.partial = err.partial;
    reply.code(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send(body);
  }
};

const getStreaks = _h(async (req, reply) => {
  reply.send(await StreaksService.getStreaks(req.params.id, req.user.id, req.user.permissions));
});

const HabitsController = {
  createHabit, getAllHabits, getMyHabits, getHabitById, updateHabit,
  updateHabitStatus, updateHabitNotes, getNoteHistory, cloneHabit,
  archiveHabit, deleteHabit,
  getStreaks,
};
export default HabitsController;
