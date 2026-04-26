import { MongoClient, ObjectId as MongoObjectId } from "mongodb";

import logger from "@/utils/logger.util.js";

class MongoDBConnection {
  constructor() {
    /**
     * Map of all connected MongoClient instances by their URIs.
     */
    this.clients    = new Map(); // Stores all connected MongoClient instances by their URIs.
    this.defaultURI = process.env.MONGO_URI; // URI for the default MongoDB connection.
    this.connecting = new Map(); // Track URIs currently in the connection process.

    this.setupGracefulShutdown(); // Set up handlers to gracefully shut down connections on process termination.
  }

  /**
   * Connect to a MongoDB instance. If already connected, return the existing connection.
   * @param {string} uri - MongoDB URI.
   * @param {Object} options - MongoClient options.
   * @returns {Promise<MongoClient>} Returns the MongoClient instance.
   */
  async connect(uri = this.defaultURI, options = {}) {
    if (this.clients.has(uri)) return this.clients.get(uri);

    if (this.connecting.get(uri)) {
      // await until the connection is established.
      while (this.connecting.get(uri)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.clients.get(uri);
    }

    const defaultOptions = {
      serverSelectionTimeoutMS: 7500,
    };

    const opts = Object.assign(defaultOptions, options);

    this.connecting.set(uri, true); // Mark URI as connecting.

    let client;
    try {
      client = new MongoClient(uri, opts);
      await client.connect();
      this.clients.set(uri, client);
      if (!this.defaultURI) this.defaultURI = uri;
      logger.info(`MongoDB connected: ${uri}`);
    } catch (e) {
      logger.error(`MongoDB connection error for URI: ${uri}`, e);
      throw e;
    } finally {
      this.connecting.delete(uri); // Remove URI from connecting map.
    }

    return client;
  }

  /**
   * Set a specific URI as the default for database operations.
   * @param {string} uri - MongoDB URI to be set as default.
   */
  setDefaultURI(uri) {
    if (!this.clients.has(uri)) {
      throw new Error(`Connection for URI ${uri} not established.`);
    }
    this.defaultURI = uri;
  }

  /**
   * Get the default MongoClient instance.
   * @returns {MongoClient} Returns the default MongoClient instance.
   */
  getDefaultClient() {
    if (!this.defaultURI) throw new Error("Default MongoDB URI not set.");
    return this.clients.get(this.defaultURI);
  }

  /**
   * Close all active MongoDB connections.
   */
  async closeAll() {
    for (const [uri, client] of this.clients) {
      await client.close();
      this.clients.delete(uri);
      logger.info(`MongoDB disconnected: ${uri}`);
    }
  }

  /**
   * Set up listeners to handle graceful shutdown on process termination signals.
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Closing MongoDB connections...`);
      await this.closeAll();
    };

    process.on("SIGINT",  shutdown.bind(null, "SIGINT"));
    process.on("SIGTERM", shutdown.bind(null, "SIGTERM"));
  }
}

const instance = new MongoDBConnection();

export const MongoDBManager = instance;
export const ObjectId       = MongoObjectId;
