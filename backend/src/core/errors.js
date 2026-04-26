/**
 * core/errors.js
 * Typed application error used across all service layers.
 * Controllers catch these and map statusCode → HTTP response.
 */
export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode  HTTP status code (default 500)
   * @param {string|null} code   Application error code (e.g. "HABIT-001")
   */
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name       = "AppError";
    this.statusCode = statusCode;
    this.code       = code || `ERR-${statusCode}`;
  }
}

/**
 * Shorthand factory.
 * @param {number} statusCode
 * @param {string} message
 * @param {string} [code]  Optional application error code
 * @returns {AppError}
 */
export const createError = (statusCode, message, code = null) => new AppError(message, statusCode, code);
