// Advanced query building utilities

export class QueryBuilder {
  constructor(model, query) {
    this.model = model;
    this.query = query;
    this.mongooseQuery = model.find();
  }

  // Apply filters
  filter() {
    const queryObj = { ...this.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|nin|regex)\b/g, match => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  // Apply sorting
  sort() {
    if (this.query.sort) {
      const sortBy = this.query.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  // Limit fields
  limitFields() {
    if (this.query.fields) {
      const fields = this.query.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  // Pagination
  paginate() {
    const page = this.query.page * 1 || 1;
    const limit = this.query.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }

  // Search across multiple fields
  search(fields) {
    if (this.query.search && fields && fields.length > 0) {
      const searchRegex = new RegExp(this.query.search, 'i');
      const searchQuery = {
        $or: fields.map(field => ({ [field]: searchRegex }))
      };
      this.mongooseQuery = this.mongooseQuery.find(searchQuery);
    }
    return this;
  }

  // Execute query
  async execute() {
    return await this.mongooseQuery;
  }

  // Count documents
  async countDocuments() {
    const queryObj = { ...this.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|nin|regex)\b/g, match => `$${match}`);

    return await this.model.countDocuments(JSON.parse(queryStr));
  }
}

// Date range helper
export const getDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0);
  }

  return { startDate, endDate: now };
};

// Aggregation pipeline helpers
export const buildAggregationPipeline = (options = {}) => {
  const pipeline = [];

  // Match stage
  if (options.match) {
    pipeline.push({ $match: options.match });
  }

  // Group stage
  if (options.group) {
    pipeline.push({ $group: options.group });
  }

  // Sort stage
  if (options.sort) {
    pipeline.push({ $sort: options.sort });
  }

  // Limit stage
  if (options.limit) {
    pipeline.push({ $limit: options.limit });
  }

  // Project stage
  if (options.project) {
    pipeline.push({ $project: options.project });
  }

  return pipeline;
};

// Text search helper
export const buildTextSearchQuery = (searchTerm, fields) => {
  if (!searchTerm || !fields || fields.length === 0) {
    return {};
  }

  return {
    $or: fields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
};