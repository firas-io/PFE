import { BaseModel } from "@/core/base.model.js";

class RefreshTokenModel extends BaseModel {
  constructor() { super("refresh-tokens"); }

  /** Store a hashed refresh token. Returns the inserted doc. */
  async create({ user_id, token_hash, expires_at }) {
    return this.insertOne({
      user_id,
      token_hash,
      expires_at,
      revoked_at: null,
      created_at: new Date(),
    });
  }

  /** Find any token (including revoked/expired) by its hash. */
  async findByHash(token_hash) {
    return this.findOne({ token_hash });
  }

  /** Find an active (non-revoked, non-expired) token by its hash. */
  async findActive(token_hash) {
    return this.findOne({
      token_hash,
      revoked_at: null,
      expires_at: { $gt: new Date() },
    });
  }

  /** Atomically revoke a single token by its _id. */
  async revokeById(id) {
    return this.updateOne({ _id: id }, { $set: { revoked_at: new Date() } });
  }

  /** Revoke all active tokens for a user (logout-all). */
  async revokeAllForUser(user_id) {
    return this.updateMany(
      { user_id, revoked_at: null },
      { $set: { revoked_at: new Date() } }
    );
  }
}

export const RefreshTokens = new RefreshTokenModel();
