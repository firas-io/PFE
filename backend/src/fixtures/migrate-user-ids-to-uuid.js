/**
 * Migrates users whose _id is a legacy BSON ObjectId to a string UUID.
 * Rewrites known foreign keys, then replaces each user row (temp email trick avoids unique collisions).
 *
 * Managers are migrated before their reports so `manager_id` can safely reference the new UUID.
 * Idempotent: skips users whose _id is not an ObjectId (e.g. system archived user).
 */
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";
import path from "path";

import { validateEnv } from "../config/env.validator.js";
import { MongoDBManager } from "../core/mongo.connect.js";
import logger from "@/utils/logger.util.js";
import { getDatabases } from "./mongo-migrate-helpers.js";

/** [collectionName, fieldName] pairs that store a user's _id */
const USER_FK_TARGETS = [
  ["habits", "utilisateur_id"],
  ["habit_logs", "utilisateur_id"],
  ["habit_stats", "utilisateur_id"],
  ["habit_note_histories", "utilisateur_id"],
  ["habit_templates", "utilisateur_id"],
  ["weekly_recaps", "user_id"],
  ["category_tickets", "user_id"],
  ["refresh_tokens", "user_id"],
  ["reminders", "utilisateur_id"],
  ["sessions", "utilisateur_id"],
  ["onboardings", "utilisateur_id"],
  ["off_days", "created_by"],
];

/**
 * Legacy users with a legacy manager also in the batch must be processed after the manager.
 */
function sortLegacyUsersTopo(users) {
  const legacyKeys = new Set(users.map((u) => String(u._id)));
  const indegree = new Map(users.map((u) => [String(u._id), 0]));
  const adj = new Map(users.map((u) => [String(u._id), []]));

  for (const u of users) {
    const m = u.manager_id;
    if (m == null || !legacyKeys.has(String(m))) continue;
    const child = String(u._id);
    const mgr = String(m);
    indegree.set(child, (indegree.get(child) || 0) + 1);
    adj.get(mgr).push(child);
  }

  const q = [];
  for (const [id, deg] of indegree) {
    if (deg === 0) q.push(id);
  }

  const orderIds = [];
  while (q.length) {
    const id = q.shift();
    orderIds.push(id);
    for (const child of adj.get(id) || []) {
      const next = (indegree.get(child) || 0) - 1;
      indegree.set(child, next);
      if (next === 0) q.push(child);
    }
  }

  if (orderIds.length !== users.length) {
    logger.warn({ action: "migrate-user-ids-to-uuid", n: users.length, ordered: orderIds.length }, "Cycle or missing edge in manager graph — falling back to arbitrary order");
    const rest = users.filter((u) => !orderIds.includes(String(u._id)));
    return [...orderIds.map((id) => users.find((u) => String(u._id) === id)).filter(Boolean), ...rest];
  }

  const byId = new Map(users.map((u) => [String(u._id), u]));
  return orderIds.map((id) => byId.get(id));
}

async function rewriteFkOnCollection(db, collName, fieldName, oldId, newId) {
  const variants = [oldId, String(oldId)];
  for (const v of variants) {
    const r = await db.collection(collName).updateMany({ [fieldName]: v }, { $set: { [fieldName]: newId } });
    if (r.modifiedCount) {
      logger.info({ coll: collName, field: fieldName, n: r.modifiedCount }, "FK rewritten for user id migration");
    }
  }
}

async function rewriteAllFks(dbs, oldId, newId) {
  for (const db of dbs) {
    for (const [coll, field] of USER_FK_TARGETS) {
      await rewriteFkOnCollection(db, coll, field, oldId, newId);
    }
    await rewriteFkOnCollection(db, "users", "manager_id", oldId, newId);
  }
}

export async function migrateUserIdsToUuid() {
  const uri = validateEnv().MONGO_URI;
  const client = await MongoDBManager.connect(uri);
  const dbs = getDatabases(client);

  const usersCol = dbs[0].collection("users");
  const legacyUsersRaw = await usersCol.find({ _id: { $type: "objectId" } }).toArray();
  if (!legacyUsersRaw.length) return;

  const legacyUsers = sortLegacyUsersTopo(legacyUsersRaw);
  const idMap = new Map(legacyUsers.map((u) => [String(u._id), uuid()]));

  let migrated = 0;
  for (const doc of legacyUsers) {
    const oldId = doc._id;
    const oldKey = String(oldId);
    const newId = idMap.get(oldKey);
    if (!newId) continue;

    const realEmail = doc.email;
    if (!realEmail) {
      logger.warn({ oldKey }, "Skipping user id migration — missing email");
      continue;
    }

    const tempEmail = `__migr_${oldKey}@habitflow.internal`;
    await usersCol.updateOne({ _id: oldId }, { $set: { email: tempEmail } });

    await rewriteAllFks(dbs, oldId, newId);

    const { _id: _omit, email: _e, ...rest } = doc;
    const m = doc.manager_id;
    const newManagerId = m == null ? m : (idMap.get(String(m)) ?? m);

    const newDoc = {
      ...rest,
      _id: newId,
      email: realEmail,
      manager_id: newManagerId,
    };

    await usersCol.insertOne(newDoc);
    await usersCol.deleteOne({ _id: oldId });
    migrated += 1;
  }

  logger.info({ action: "migrate-user-ids-to-uuid", count: migrated }, "User _id values migrated from ObjectId to UUID");
}

async function main() {
  await migrateUserIdsToUuid();
  console.log("migrate-user-ids-to-uuid: done.");
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
