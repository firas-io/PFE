import { CategoryTickets } from "@/modules/category-tickets/models/CategoryTicket.model.js";
import logger from "@/utils/logger.util.js";

export async function migrateTicketsTypeField() {
  try {
    const result = await CategoryTickets.updateMany(
      { type: { $exists: false } },
      { $set: { type: "categorie" } }
    );
    if (result.modifiedCount > 0) {
      logger.info({ action: "migrate-tickets-type-field", count: result.modifiedCount }, "Added type:'categorie' to existing tickets");
    }
  } catch (err) {
    logger.error({ err }, "migrateTicketsTypeField failed");
  }
}
