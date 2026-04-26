/**
 * Migrates remaining collections whose root `_id` is still a BSON ObjectId to string UUIDs.
 * Depends on users already using UUID (`migrateUserIdsToUuid` runs before this).
 *
 * Order: roles → category_tickets → habit_templates → habits (and habit_id FKs + recap stats)
 * → habit_logs / habit_stats / habit_note_histories → reminders → weekly_recaps / admin_stats
 * → refresh_tokens → sessions → onboardings → off_days
 *
 * New inserts already get UUID via BaseModel.insertOne; this only normalizes legacy rows.
 */
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";
import path from "path";

import { MongoDBManager } from "../core/mongo.connect.js";
import logger from "@/utils/logger.util.js";
import { getDatabases, getDbForCollection, getMongoUri } from "./mongo-migrate-helpers.js";

const OID = { $type: "objectId" };

async function rewriteField(db, coll, field, oldId, newId, logCtx) {
  const variants = [oldId, String(oldId)];
  for (const v of variants) {
    const r = await db.collection(coll).updateMany({ [field]: v }, { $set: { [field]: newId } });
    if (r.modifiedCount && logCtx) {
      logger.info({ ...logCtx, coll, field, n: r.modifiedCount }, "FK rewritten (entity id migration)");
    }
  }
}

async function replaceRootId(coll, doc, newId) {
  const { _id, ...rest } = doc;
  await coll.insertOne({ _id: newId, ...rest });
  await coll.deleteOne({ _id: _id });
}

/** Free a unique business key on the old row before inserting the replacement (avoids E11000 on nom, etc.). */
async function replaceRootIdFreeingUniqueField(coll, doc, newId, uniqueField) {
  const oldId = doc._id;
  const original = doc[uniqueField];
  if (original !== undefined && original !== null) {
    await coll.updateOne({ _id: oldId }, { $set: { [uniqueField]: `__migr_${String(oldId)}` } });
  }
  const { _id, ...rest } = doc;
  await coll.insertOne({ _id: newId, ...rest });
  await coll.deleteOne({ _id: oldId });
}

async function patchWeeklyRecapHabitIds(db, oldId, newId) {
  const paths = ["stats.bestHabit.habitId", "stats.worstHabit.habitId", "stats.streakHighlight.habitId"];
  for (const pathKey of paths) {
    for (const v of [oldId, String(oldId)]) {
      const r = await db.collection("weekly_recaps").updateMany({ [pathKey]: v }, { $set: { [pathKey]: newId } });
      if (r.modifiedCount) {
        logger.info({ coll: "weekly_recaps", path: pathKey, n: r.modifiedCount }, "Weekly recap stats habitId rewritten");
      }
    }
  }
}

async function rewriteHabitIdAcross(client, primary, oldId, newId) {
  await rewriteField(primary, "habit_logs", "habit_id", oldId, newId, { phase: "habits" });
  await rewriteField(primary, "habit_stats", "habit_id", oldId, newId, { phase: "habits" });
  await rewriteField(primary, "habit_note_histories", "habit_id", oldId, newId, { phase: "habits" });
  const remDb = getDbForCollection(client, "reminders", primary);
  await rewriteField(remDb, "reminders", "habit_id", oldId, newId, { phase: "habits" });
  await patchWeeklyRecapHabitIds(primary, oldId, newId);
}

async function migrateRoles(client, primary) {
  const rolesCol = primary.collection("roles");
  const usersCol = primary.collection("users");
  const legacy = await rolesCol.find({ _id: OID }).toArray();
  for (const doc of legacy) {
    const oldId = doc._id;
    const newId = uuid();
    await rewriteField(primary, "users", "role", oldId, newId, { phase: "roles" });
    await replaceRootIdFreeingUniqueField(rolesCol, doc, newId, "nom");
  }
  if (legacy.length) logger.info({ action: "migrate-entity-ids", phase: "roles", count: legacy.length }, "Role _id migrated to UUID");
}

async function migrateCategoryTickets(client, primary) {
  const col = primary.collection("category_tickets");
  const legacy = await col.find({ _id: OID }).toArray();
  for (const doc of legacy) {
    const oldId = doc._id;
    const newId = uuid();
    await rewriteField(primary, "habits", "categorie_ticket_id", oldId, newId, { phase: "category_tickets" });
    await replaceRootId(col, doc, newId);
  }
  if (legacy.length) {
    logger.info({ action: "migrate-entity-ids", phase: "category_tickets", count: legacy.length }, "Category ticket _id migrated to UUID");
  }
}

async function migrateHabitTemplates(_client, primary) {
  const col = primary.collection("habit_templates");
  const legacy = await col.find({ _id: OID }).toArray();
  for (const doc of legacy) {
    const newId = uuid();
    await replaceRootIdFreeingUniqueField(col, doc, newId, "nom_template");
  }
  if (legacy.length) {
    logger.info({ action: "migrate-entity-ids", phase: "habit_templates", count: legacy.length }, "Habit template _id migrated to UUID");
  }
}

async function migrateHabits(client, primary) {
  const col = primary.collection("habits");
  const legacy = await col.find({ _id: OID }).toArray();
  for (const doc of legacy) {
    const oldId = doc._id;
    const newId = uuid();
    await rewriteHabitIdAcross(client, primary, oldId, newId);
    await replaceRootId(col, doc, newId);
  }
  if (legacy.length) {
    logger.info({ action: "migrate-entity-ids", phase: "habits", count: legacy.length }, "Habit _id migrated to UUID");
  }
}

async function migrateRootIdsOnly(client, primary, collName) {
  const db = getDbForCollection(client, collName, primary);
  const col = db.collection(collName);
  const legacy = await col.find({ _id: OID }).toArray();
  for (const doc of legacy) {
    const newId = uuid();
    await replaceRootId(col, doc, newId);
  }
  if (legacy.length) {
    logger.info({ action: "migrate-entity-ids", phase: collName, count: legacy.length }, "Document _id migrated to UUID");
  }
}

export async function migrateLegacyEntityIdsToUuid() {
  const client = await MongoDBManager.connect(getMongoUri());
  const dbs = getDatabases(client);
  const primary = dbs[0];

  await migrateRoles(client, primary);
  await migrateCategoryTickets(client, primary);
  await migrateHabitTemplates(client, primary);
  await migrateHabits(client, primary);

  await migrateRootIdsOnly(client, primary, "habit_logs");
  await migrateRootIdsOnly(client, primary, "habit_stats");
  await migrateRootIdsOnly(client, primary, "habit_note_histories");
  await migrateRootIdsOnly(client, primary, "reminders");
  await migrateRootIdsOnly(client, primary, "weekly_recaps");
  await migrateRootIdsOnly(client, primary, "admin_stats");
  await migrateRootIdsOnly(client, primary, "refresh_tokens");
  await migrateRootIdsOnly(client, primary, "sessions");
  await migrateRootIdsOnly(client, primary, "onboardings");
  await migrateRootIdsOnly(client, primary, "off_days");

  logger.info({ action: "migrate-legacy-entity-ids-to-uuid" }, "Legacy entity ObjectId → UUID pass completed");
}

async function main() {
  await migrateLegacyEntityIdsToUuid();
  console.log("migrate-legacy-entity-ids-to-uuid: done.");
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
