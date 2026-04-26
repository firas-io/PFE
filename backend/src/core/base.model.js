import { v4 as uuid } from "uuid";
import { ObjectId }   from "mongodb";

import { validateEnv }   from "@/config/env.validator.js";
import { MongoDBManager } from "./mongo.connect.js";

/** Returns an ObjectId if `id` is a 24-char hex string, otherwise returns `id` as-is. */
function toId(id) {
  if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
    try { return new ObjectId(id); } catch { /* fall through */ }
  }
  return id;
}

export class BaseModel {
  /**
   * @param {string} collectionName  MongoDB collection name
   * @param {string} dbName          MongoDB database name
   * @param {string} connectionURI   MongoDB connection URI
   */
  constructor(collectionName, dbName, connectionURI = validateEnv().MONGO_URI) {
    this.collectionName = collectionName;
    this.dbName         = dbName;
    this.connectionURI  = connectionURI;
  }

  /**
   * Gets the MongoDB database instance.
   * @returns {Promise<mongodb.Db>}
   */
  async _getDB() {
    if (!this.db) this.db = (await MongoDBManager.connect(this.connectionURI)).db(this.dbName);
    return this.db;
  }

  /**
   * Gets the MongoDB collection instance.
   * @returns {Promise<mongodb.Collection>}
   */
  async _getCollection() {
    return (await this._getDB()).collection(this.collectionName);
  }

  /** Converts `_id` string in a filter to ObjectId if it's a legacy 24-char hex. */
  _f(filter) {
    if (filter && typeof filter._id === "string") {
      return { ...filter, _id: toId(filter._id) };
    }
    return filter;
  }

  // ─── Write operations ────────────────────────────────────────────────────────

  /**
   * Insert a document. Automatically adds _id (uuid v4).
   * Returns the inserted document.
   */
  async insertOne(doc, options) {
    const toInsert = { ...doc, _id: doc._id ?? uuid() };
    await (await this._getCollection()).insertOne(toInsert, options);
    return toInsert;
  }

  /**
   * Insert multiple documents. Automatically adds _id (uuid v4) to each.
   * @returns {Promise<mongodb.InsertManyResult>}
   */
  async insertMany(...args) {
    args[0] = args[0]?.map((doc) => ({ ...doc, _id: doc._id ?? uuid() }));
    return (await this._getCollection()).insertMany(...args);
  }

  /**
   * Find one document and update it. Automatically updates `updatedAt`.
   * Returns the updated document.
   */
  async updateOne(filter, update, options = {}) {
    return (await this._getCollection()).findOneAndUpdate(
      this._f(filter),
      { ...update, $set: { ...(update.$set ?? {}), updatedAt: new Date() } },
      { returnDocument: "after", ...options }
    );
  }

  /**
   * Update multiple documents matching the filter.
   * @returns {Promise<mongodb.UpdateResult>}
   */
  async updateMany(...args) {
    return (await this._getCollection()).updateMany(...args);
  }

  /**
   * Replace a single document.
   * @returns {Promise<mongodb.UpdateResult>}
   */
  async replace(...args) {
    return (await this._getCollection()).replaceOne(...args);
  }

  /**
   * Perform a bulk write operation.
   * @returns {Promise<mongodb.BulkWriteResult>}
   */
  async bulkWrite(...args) {
    return (await this._getCollection()).bulkWrite(...args);
  }

  // ─── Delete operations ───────────────────────────────────────────────────────

  /**
   * Delete the first document matching filter.
   * Returns true if a document was deleted.
   */
  async deleteOne(filter) {
    const result = await (await this._getCollection()).deleteOne(this._f(filter));
    return result.deletedCount > 0;
  }

  /**
   * Delete all documents matching filter.
   * @returns {Promise<mongodb.DeleteResult>}
   */
  async deleteMany(...args) {
    return (await this._getCollection()).deleteMany(...args);
  }

  /**
   * Alias for deleteMany — removes all documents matching the filter.
   * @returns {Promise<mongodb.DeleteResult>}
   */
  async remove(...args) {
    return (await this._getCollection()).deleteMany(...args);
  }

  // ─── Read operations ─────────────────────────────────────────────────────────

  /** Find by _id — handles both UUID strings and legacy ObjectId hex strings. */
  async findById(id) {
    return (await this._getCollection()).findOne({ _id: toId(id) });
  }

  /**
   * Find a single document matching the filter.
   * @returns {Promise<object|null>}
   */
  async findOne(...args) {
    return (await this._getCollection()).findOne(...args);
  }

  /**
   * Find multiple documents. Returns an array.
   * @param {object} filter
   * @param {{ sort?, skip?, limit?, projection? }} options
   */
  async find(filter = {}, options = {}) {
    let cursor = (await this._getCollection()).find(filter);
    if (options.sort)       cursor = cursor.sort(options.sort);
    if (options.skip)       cursor = cursor.skip(options.skip);
    if (options.limit)      cursor = cursor.limit(options.limit);
    if (options.projection) cursor = cursor.project(options.projection);
    return cursor.toArray();
  }

  /**
   * Count documents matching the filter.
   * @returns {Promise<number>}
   */
  async count(...args) {
    return (await this._getCollection()).countDocuments(...args);
  }

  /**
   * Count documents matching the filter (native driver alias).
   * @returns {Promise<number>}
   */
  async countDocuments(...args) {
    return (await this._getCollection()).countDocuments(...args);
  }

  /**
   * Run an aggregation pipeline. Returns an array.
   * @returns {Promise<object[]>}
   */
  async aggregate(pipeline, options) {
    return (await this._getCollection()).aggregate(pipeline, options).toArray();
  }

  /**
   * Create an index on the collection.
   * @returns {Promise<string>}
   */
  async createIndex(...args) {
    return (await this._getCollection()).createIndex(...args);
  }
}

export default BaseModel;
