/**
 * Migrates legacy user documents to English camelCase field names.
 * - Runs automatically on API startup (see app.js).
 * - Idempotent: safe to run multiple times.
 * - CLI: node backend/src/fixtures/migrate-users-english-fields.js
 */
import { fileURLToPath } from "url";
import path from "path";
import { validateEnv } from "../config/env.validator.js";
import { MongoDBManager } from "../core/mongo.connect.js";
import logger from "@/utils/logger.util.js";

export async function migrateUsersEnglishFields() {
  const uri = validateEnv().MONGO_URI;
  const db = (await MongoDBManager.connect(uri)).db();
  const users = db.collection("users");

  let n = 0;
  const cursor = users.find({});

  for await (const doc of cursor) {
    const set = {};
    const unset = {};

    if (doc.firstName === undefined && doc.prenom !== undefined) {
      set.firstName = doc.prenom;
      unset.prenom = "";
    }
    if (doc.lastName === undefined && doc.nom !== undefined) {
      set.lastName = doc.nom;
      unset.nom = "";
    }
    if (doc.passwordHash === undefined && doc.mot_de_passe !== undefined) {
      set.passwordHash = doc.mot_de_passe;
      unset.mot_de_passe = "";
    }
    if (doc.department === undefined && doc.departement !== undefined) {
      set.department = doc.departement;
      unset.departement = "";
    }
    if (doc.lastLoginAt === undefined && doc.dernier_login !== undefined) {
      set.lastLoginAt = doc.dernier_login;
      unset.dernier_login = "";
    }
    if (doc.firstLoginAt === undefined && doc.first_login_at !== undefined) {
      set.firstLoginAt = doc.first_login_at;
      unset.first_login_at = "";
    }
    if (doc.date_creation !== undefined) unset.date_creation = "";

    // Store role as string (24-hex or UUID) so BSON is not ObjectId on user doc; findById still resolves hex → ObjectId for roles lookup.
    if (doc.role != null && typeof doc.role !== "string") {
      set.role = String(doc.role);
    }

    if (!Object.keys(set).length && !Object.keys(unset).length) continue;

    const ops = {};
    if (Object.keys(set).length) ops.$set = set;
    if (Object.keys(unset).length) ops.$unset = unset;
    await users.updateOne({ _id: doc._id }, ops);
    n += 1;
  }

  if (n > 0) {
    logger.info({ action: "migrate-users-english-fields", count: n }, "User documents migrated to English camelCase fields");
  }
}

async function main() {
  await migrateUsersEnglishFields();
  console.log("migrate-users-english-fields: done.");
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
