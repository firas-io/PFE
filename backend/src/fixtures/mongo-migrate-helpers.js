import { validateEnv } from "../config/env.validator.js";

/** DB from URI + optional second DB when reminders/sessions live on `habitflow` only. */
export function getDatabases(client) {
  const defaultDb = client.db();
  const dbs = [defaultDb];
  if (defaultDb.databaseName !== "habitflow") {
    const alt = client.db("habitflow");
    if (alt.databaseName !== defaultDb.databaseName) dbs.push(alt);
  }
  return dbs;
}

/** Collection host: reminders/sessions/onboardings use explicit `habitflow` when URI DB differs. */
export function getDbForCollection(client, collectionName, primaryDb) {
  const onHabitflow = new Set(["reminders", "sessions", "onboardings"]);
  if (onHabitflow.has(collectionName) && primaryDb.databaseName !== "habitflow") {
    return client.db("habitflow");
  }
  return primaryDb;
}

export function getMongoUri() {
  return validateEnv().MONGO_URI;
}
