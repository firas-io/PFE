import { CategoryTickets } from "../models/CategoryTicket.model.js";
import { Users }           from "@/modules/users/models/User.model.js";
import { paginate }        from "@/helpers/pagination.helper.js";
import { AppError }        from "@/core/errors.js";
import logger              from "@/utils/logger.util.js";

const VALID_STATUSES  = ["pending", "in_review", "done", "rejected"];
const FINAL_STATUSES  = ["done", "rejected"];
const VALID_TYPES     = ["categorie", "habitude"];

class CategoryTicketsService {
  // ─── User routes ────────────────────────────────────────────────────────────

  static async getMyTickets(userId) {
    return CategoryTickets.find({ user_id: userId }, { sort: { createdAt: -1 } });
  }

  static async createTicket(body, userId, userRole) {
    const { type, description, requested_name, habit_data, scope = "personal" } = body;

    if (!type || !VALID_TYPES.includes(type))
      throw new AppError(`type est requis et doit être: ${VALID_TYPES.join(", ")}`, 400, "TKT-009");

    if (!requested_name || !String(requested_name).trim())
      throw new AppError("requested_name est requis", 400, "TKT-001");

    if (type === "habitude" && (!habit_data || !habit_data.nom))
      throw new AppError("habit_data.nom est requis pour un ticket de type habitude", 400, "TKT-010");

    const validScopes = ["personal", "team"];
    if (!validScopes.includes(scope))
      throw new AppError("scope doit être 'personal' ou 'team'", 400, "TKT-007");

    if (scope === "team" && userRole !== "manager")
      throw new AppError("Seuls les managers peuvent créer des tickets pour l'équipe", 403, "TKT-008");

    const doc = {
      user_id:        userId,
      type,
      requested_name: String(requested_name).trim(),
      description:    description ? String(description).trim() : null,
      scope,
      status:         "pending",
      admin_note:     null,
      resolved_by:    null,
      resolved_at:    null,
    };

    if (type === "habitude") {
      doc.habit_data = {
        nom:         habit_data.nom         || null,
        categorie:   habit_data.categorie   || null,
        frequence:   habit_data.frequence   || null,
        objectif:    habit_data.objectif    || null,
        priorite:    habit_data.priorite    || null,
        description: habit_data.description || null,
      };
    }

    logger.info({ action: "create-ticket", userId, type, scope }, "Ticket created");
    return CategoryTickets.insertOne(doc);
  }

  // Legacy alias kept for backward compat
  static async create(body, userId, userRole) {
    // Old call used title/proposed_category_name — map to new schema
    const mapped = {
      ...body,
      type:           body.type           || "categorie",
      requested_name: body.requested_name || body.proposed_category_name || body.title,
    };
    return CategoryTicketsService.createTicket(mapped, userId, userRole);
  }

  static async deleteOwn(id, userId) {
    const ticket = await CategoryTickets.findById(id);
    if (!ticket) throw new AppError("Ticket introuvable", 404, "TKT-002");
    if (ticket.user_id !== userId) throw new AppError("Accès refusé", 403, "TKT-003");
    if (ticket.status !== "pending")
      throw new AppError("Seuls les tickets en attente peuvent être supprimés", 400, "TKT-004");

    await CategoryTickets.deleteOne({ _id: id });
    logger.info({ action: "delete-ticket", id, userId }, "Ticket deleted by owner");
  }

  // ─── Admin routes ────────────────────────────────────────────────────────────

  static async getAll(query = {}) {
    const filter = {};
    if (query?.status && VALID_STATUSES.includes(query.status)) filter.status = query.status;
    if (query?.type   && VALID_TYPES.includes(query.type))     filter.type   = query.type;

    const page  = parseInt(query?.page)  || 1;
    const limit = parseInt(query?.limit) || 10;

    const { data, pagination } = await paginate(CategoryTickets, filter, page, limit, { sort: { createdAt: -1 } });

    // Populate user (nom + email)
    const hydrated = await Promise.all(
      data.map(async (t) => {
        const user = t.user_id ? await Users.findById(t.user_id) : null;
        return {
          ...t,
          user: user ? {
            _id:       user._id,
            lastName:  user.lastName  ?? user.nom,
            firstName: user.firstName ?? user.prenom,
            email:     user.email,
          } : null,
        };
      })
    );

    return { data: hydrated, pagination };
  }

  static async updateStatus(id, body, adminId) {
    const { status, admin_note } = body;
    if (!status) throw new AppError("status est requis", 400, "TKT-005");
    if (!VALID_STATUSES.includes(status))
      throw new AppError(`status doit être: ${VALID_STATUSES.join(", ")}`, 400, "TKT-006");

    const ticket = await CategoryTickets.findById(id);
    if (!ticket) throw new AppError("Ticket introuvable", 404, "TKT-002");

    const patch = { status };
    if (admin_note !== undefined) patch.admin_note = admin_note;
    if (FINAL_STATUSES.includes(status)) {
      patch.resolved_by = adminId;
      patch.resolved_at = new Date();
    } else {
      patch.resolved_by = null;
      patch.resolved_at = null;
    }

    logger.info({ action: "update-ticket-status", id, status, adminId, type: ticket.type }, "Ticket status updated");
    const updated = await CategoryTickets.updateOne({ _id: id }, { $set: patch });

    // Auto-creation removed — admin creates categories/habits manually.
    // The status update simply records the decision.

    return updated;
  }
}

export default CategoryTicketsService;
