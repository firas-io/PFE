import fs           from "fs";
import { GridFSBucket } from "mongodb";
import path         from "path";
import { Readable } from "stream";

import { MongoDBManager } from "./mongo.connect.js";

/**
 * Represents a MongoDB GridFS bucket.
 */
class Bucket {
  /**
   * @param {string} bucketName    - The name of the GridFS bucket.
   * @param {string} dbName        - The name of the database.
   * @param {string} connectionURI - The MongoDB connection URI.
   */
  constructor(bucketName, dbName, connectionURI = process.env.MONGO_URI) {
    this.bucketName    = bucketName;
    this.dbName        = dbName;
    this.connectionURI = connectionURI;
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
   * Gets the GridFSBucket instance.
   * @returns {Promise<mongodb.GridFSBucket>}
   */
  async _getBucket() {
    return new GridFSBucket(await this._getDB(), { bucketName: this.bucketName });
  }

  /**
   * Deletes a file from the bucket.
   * @returns {Promise<void>}
   */
  async delete(...args) {
    return (await this._getBucket()).delete(...args);
  }

  /**
   * Finds files in the bucket.
   * @returns {Promise<mongodb.FindCursor>}
   */
  async find(...args) {
    return (await this._getBucket()).find(...args);
  }

  /**
   * Writes a file from a Buffer to the bucket.
   * @param {string} fileName - The name of the file.
   * @param {Buffer} buffer   - The buffer containing the file data.
   * @param {Object} options  - Options for openUploadStream.
   * @returns {Promise<mongodb.ObjectId>}
   */
  async writeFromBuffer(fileName, buffer, options) {
    const gfStream = (await this._getBucket()).openUploadStream(fileName, options);
    await this._writeBufferIntoGFS(gfStream, buffer);
    return gfStream.id;
  }

  /**
   * Writes a file from a readable stream to the bucket.
   * @param {string}         fileName - The name of the file.
   * @param {ReadableStream} stream   - The stream containing the file data.
   * @param {Object}         options  - Options for openUploadStream.
   * @returns {Promise<mongodb.ObjectId>}
   */
  async writeFromStream(fileName, stream, options) {
    const gfStream = (await this._getBucket()).openUploadStream(fileName, options);
    await this._writeStreamIntoGFS(gfStream, stream);
    return gfStream.id;
  }

  /**
   * Writes a file from a local file path to the bucket.
   * @param {string} _path - The local file path.
   * @returns {Promise<mongodb.ObjectId>}
   */
  async writeFromPath(_path) {
    const gfStream = (await this._getBucket()).openUploadStream(path.basename(_path));
    return this._writeBufferIntoGFS(gfStream, fs.readFileSync(_path));
  }

  /**
   * Counts the number of files in the bucket.
   * @returns {Promise<number>}
   */
  async count(...args) {
    return (await this._getBucket()).find(...args).count();
  }

  /**
   * Opens a download stream for a file by its ObjectId.
   * @param {mongodb.ObjectId} _id
   * @returns {Promise<mongodb.GridFSBucketReadStream>}
   */
  async readById(_id) {
    return (await this._getBucket()).openDownloadStream(_id);
  }

  /**
   * Opens a download stream for a file by its filename.
   * @param {string} filename
   * @returns {Promise<mongodb.GridFSBucketReadStream>}
   */
  async readByName(filename) {
    return (await this._getBucket()).openDownloadStreamByName(filename);
  }

  // ─── Internals ────────────────────────────────────────────────────────────────

  _writeBufferIntoGFS(gfstream, buffer) {
    return new Promise((resolve, reject) => {
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream.pipe(gfstream);

      gfstream.on("finish", (e) => { stream.destroy(); resolve(e); });
      gfstream.on("error",  (e) => { stream.destroy(); reject(e);  });
    });
  }

  _writeStreamIntoGFS(gfstream, stream) {
    return new Promise((resolve, reject) => {
      stream.pipe(gfstream);
      gfstream.on("finish", resolve);
      gfstream.on("error",  reject);
    });
  }
}

export default Bucket;
