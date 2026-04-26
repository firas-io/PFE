import { CategoryTickets } from "../models/CategoryTicket.model.js";
import { Users }           from "@/modules/users/models/User.model.js";
import { Roles }           from "@/modules/roles/models/Role.model.js";
import { Habits }          from "@/modules/habits/models/Habit.model.js";
import { AppError }        from "@/core/errors.js";
import logger              from "@/utils/logger.util.js";

const VALID_STATUSES  = ["pending", "in_review", "done", "rejected"];
// Statuts finaux : posent resolved_by/resolved_at. Réouverture vers un autre statut les efface.
const FINAL_STATUSES  = ["done", "rejected"];

class CategoryTicketsService {
  // ─── User routes ────────────────────────────────────────────────────────────

  static async getMyTickets(userId) {
    return CategoryTickets.find({ user_id: userId }, { sort: { createdAt: -1 } });
  }

  static async create(body, userId) {
    const { title, description, proposed_category_name, scope = "personal" } = body;
    if (!title) throw new AppError("title est requis", 400, "TKT-001");

    const validScopes = ["personal", "team"];
    if (!validScopes.includes(scope))
      throw new AppError("scope doit être 'personal' ou 'team'", 400, "TKT-007");

    if (scope === "team") {
      const user = await Users.findById(userId);
      const role = user?.role_id ? await Roles.findById(user.role_id) : null;
      if (!role || role.name !== "manager")
        throw new AppError("Seuls les managers peuvent créer des tickets pour l'équipe", 403, "TKT-008");
    }

    logger.info({ action: "create-ticket", userId, scope }, "Category ticket created");
    return CategoryTickets.insertOne({
      user_id:     userId,
      title:       String(title).trim(),
      description: description ? String(description).trim() : null,
      proposed_category_name: proposed_category_name ? String(proposed_category_name).trim() : null,
      scope,
      status:      "pending",
      admin_note:  null,
      resolved_by: null,
      resolved_at: null,
    });
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

  static async getAll(query) {
    const filter = {};
    if (query?.status && VALID_STATUSES.includes(query.status)) filter.status = query.status;

    const tickets = await CategoryTickets.find(filter, { sort: { createdAt: -1 } });

    // Populate user (nom + email)
    return Promise.all(
      tickets.map(async (t) => {
        const user = t.user_id ? await Users.findById(t.user_id) : null;
        return {
          ...t,
          user: user ? {
            _id: user._id,
            lastName: user.lastName ?? user.nom,
            firstName: user.firstName ?? user.prenom,
            email: user.email,
          } : null,
        };
      })
    );
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
      // Réouverture (pending/in_review) — efface la résolution précédente
      patch.resolved_by = null;
      patch.resolved_at = null;
    }

    logger.info({ action: "update-ticket-status", id, status, adminId }, "Ticket status updated");
    const updated = await CategoryTickets.updateOne({ _id: id }, { $set: patch });

    // If approved, propagate the validated category label to habits and push to user(s).
    if (status === "done") {
      const approvedName = String(admin_note || ticket.proposed_category_name || "").trim();
      if (approvedName) {
        await Habits.updateMany(
          { categorie_ticket_id: id },
          { $set: { categorie: "autre", categorie_label: approvedName } }
        );

        const customEntry = { label: approvedName, ticket_id: id, created_at: new Date() };

        if (ticket.scope === "team") {
          // Push to all team members (users whose manager_id = ticket requester)
          await Users.updateMany(
            { manager_id: ticket.user_id },
            { $push: { custom_categories: customEntry } }
          );
          // Also push to the manager themselves
          await Users.updateOne({ _id: ticket.user_id }, { $push: { custom_categories: customEntry } });
        } else {
          // Personal scope — only the requesting user
          await Users.updateOne({ _id: ticket.user_id }, { $push: { custom_categories: customEntry } });
        }
      }
    }
    return updated;
  }
}

export default CategoryTicketsService;
