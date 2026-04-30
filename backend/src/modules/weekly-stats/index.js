import weeklyStatsRoutes from "./routes/weekly-stats.routes.js";

export default async function weeklyStatsModule(app) {
  app.register(weeklyStatsRoutes);
}
