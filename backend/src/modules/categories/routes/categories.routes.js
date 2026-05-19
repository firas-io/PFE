import CategoriesController from "../controllers/categories.controller.js";

const list             = (s) => ({ method: "GET",    url: "/categories",                    preHandler: s.auth([s.verifyAccessToken]),                                                                         handler: CategoriesController.list });
const availableForUser = (s) => ({ method: "GET",    url: "/categories/available-for-user", preHandler: s.auth([s.verifyAccessToken]),                                                                         handler: CategoriesController.availableForUser });
const getBySlug        = (s) => ({ method: "GET",    url: "/categories/:slug",              preHandler: s.auth([s.verifyAccessToken]),                                                                         handler: CategoriesController.getBySlug });
const listAll          = (s) => ({ method: "GET",    url: "/admin/categories",              preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Category" }])]),          handler: CategoriesController.listAll });
const create           = (s) => ({ method: "POST",   url: "/admin/categories",              preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Category" }])]),          handler: CategoriesController.create });
const update           = (s) => ({ method: "PATCH",  url: "/admin/categories/:id",          preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Category" }])]),          handler: CategoriesController.update });
const remove           = (s) => ({ method: "DELETE", url: "/admin/categories/:id",          preHandler: s.auth([s.verifyAccessToken, s.verifyAbility([{ action: "manage", subject: "Category" }])]),          handler: CategoriesController.remove });

const routes = [list, availableForUser, getBySlug, listAll, create, update, remove];

export default async function categoriesRoutes(fastify) {
  routes.forEach((r) => fastify.route(r(fastify)));
}
