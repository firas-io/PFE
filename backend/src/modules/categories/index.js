import categoriesRoutes from "./routes/categories.routes.js";

export default async function categoriesModule(app) {
  await app.register(categoriesRoutes);
}
