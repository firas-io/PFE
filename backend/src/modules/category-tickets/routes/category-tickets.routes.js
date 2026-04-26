import CategoryTicketsController from "../controllers/category-tickets.controller.js";

// Static routes (/my, /admin-list) BEFORE parameterised (/:id)
const getMyTickets = (s) => ({ method: "GET",    url: "/category-tickets/my",          preHandler: s.auth([s.verifyAccessToken]),                                                                    handler: CategoryTicketsController.getMyTickets });
const create       = (s) => ({ method: "POST",   url: "/category-tickets",             preHandler: s.auth([s.verifyAccessToken]),                                                                    handler: CategoryTicketsController.create });
const getAll       = (s) => ({ method: "GET",    url: "/category-tickets",             preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Ticket" }])]),       handler: CategoryTicketsController.getAll });
const updateStatus = (s) => ({ method: "PATCH",  url: "/category-tickets/:id/status", preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Ticket" }])]),       handler: CategoryTicketsController.updateStatus });
const deleteOwn    = (s) => ({ method: "DELETE", url: "/category-tickets/:id",        preHandler: s.auth([s.verifyAccessToken]),                                                                    handler: CategoryTicketsController.deleteOwn });

const routes = [getMyTickets, create, getAll, updateStatus, deleteOwn];

export default async function categoryTicketsRoutes(fastify) {
  routes.forEach(r => fastify.route(r(fastify)));
}
