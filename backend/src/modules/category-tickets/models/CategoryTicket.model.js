import { BaseModel } from "@/core/base.model.js";
class CategoryTicketModel extends BaseModel { constructor() { super("category-tickets"); } }
export const CategoryTickets = new CategoryTicketModel();
export default CategoryTickets;
