import { OffDays }  from "../models/OffDay.model.js";
import { AppError } from "@/core/errors.js";
import logger       from "@/utils/logger.util.js";

const VALID_TYPES = ["holiday", "maintenance", "special", "other"];

class OffDaysService {
  static async getAll() {
    return OffDays.find({}, { sort: { date: 1 } });
  }

  static async getRange(start, end) {
    if (!start || !end) throw new AppError("start et end sont requis", 400, "OFD-001");
    const startDate = new Date(start);
    const endDate   = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) throw new AppError("Dates invalides", 400, "OFD-002");
    return OffDays.find({ date: { $gte: startDate, $lte: endDate } }, { sort: { date: 1 } });
  }

  static async create(body, adminId) {
    const { date, label, type } = body;
    if (!date || !label) throw new AppError("date et label sont requis", 400, "OFD-003");

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) throw new AppError("Date invalide", 400, "OFD-002");

    const resolvedType = VALID_TYPES.includes(type) ? type : "holiday";

    const existing = await OffDays.findOne({ date: parsedDate });
    if (existing) throw new AppError("Un jour off existe déjà pour cette date", 409, "OFD-004");

    logger.info({ action: "create-off-day", date, adminId }, "Off-day created");
    return OffDays.insertOne({ date: parsedDate, label: String(label).trim(), type: resolvedType, created_by: adminId });
  }

  static async update(id, body) {
    const offDay = await OffDays.findById(id);
    if (!offDay) throw new AppError("Jour off introuvable", 404, "OFD-005");

    const patch = {};
    if (body.label !== undefined) patch.label = String(body.label).trim();
    if (body.type  !== undefined) patch.type  = VALID_TYPES.includes(body.type) ? body.type : offDay.type;
    if (body.date  !== undefined) {
      const d = new Date(body.date);
      if (isNaN(d)) throw new AppError("Date invalide", 400, "OFD-002");
      patch.date = d;
    }

    return OffDays.updateOne({ _id: id }, { $set: patch });
  }

  static async delete(id) {
    const offDay = await OffDays.findById(id);
    if (!offDay) throw new AppError("Jour off introuvable", 404, "OFD-005");
    await OffDays.deleteOne({ _id: id });
    logger.info({ action: "delete-off-day", id }, "Off-day deleted");
  }
}

export default OffDaysService;
