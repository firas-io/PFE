/**
 * Paginate a MongoDB collection query.
 * @param {import('../core/base.model.js').BaseModel} model - BaseModel instance
 * @param {object} filter - MongoDB filter
 * @param {number} page   - Current page (1-based)
 * @param {number} limit  - Documents per page
 * @param {object} options - Extra find options (sort, projection, etc.)
 * @returns {{ data: object[], pagination: object }}
 */
export async function paginate(model, filter = {}, page = 1, limit = 10, options = {}) {
  const safePage  = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.max(1, parseInt(limit) || 10);
  const skip      = (safePage - 1) * safeLimit;

  const [total, data] = await Promise.all([
    model.countDocuments(filter),
    model.find(filter, { ...options, skip, limit: safeLimit }),
  ]);

  const pages = Math.ceil(total / safeLimit);

  return {
    data,
    pagination: {
      total,
      pages,
      currentPage: safePage,
      limit: safeLimit,
      hasNext: safePage < pages,
      hasPrev: safePage > 1,
    },
  };
}
