import CategoriesController from "../controllers/categories.controller.js";

const list = (s) => ({
  method: "GET",
  url: "/categories",
  preHandler: s.auth([s.verifyAccessToken]),
  handler: CategoriesController.list,
});

const getBySlug = (s) => ({
  method: "GET",
  url: "/categories/:slug",
  preHandler: s.auth([s.verifyAccessToken]),
  handler: CategoriesController.getBySlug,
});

const routes = [list, getBySlug];

export default async function categoriesRoutes(fastify) {
  routes.forEach((r) => fastify.route(r(fastify)));
}
