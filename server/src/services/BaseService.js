class BaseService {
  constructor(model) {
    this.model = model;
  }

  // Create a new document
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new Error(`Create operation failed: ${error.message}`);
    }
  }

  // Find documents with advanced query options
  async findAll(options = {}) {
    try {
      const {
        filter = {},
        select = '',
        populate = '',
        sort = { createdAt: -1 },
        page = 1,
        limit = 10,
        lean = false
      } = options;

      const skip = (page - 1) * limit;

      let query = this.model.find(filter);

      if (select) query = query.select(select);
      if (populate) query = query.populate(populate);
      if (lean) query = query.lean();

      const documents = await query
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await this.model.countDocuments(filter);

      return {
        data: documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Find operation failed: ${error.message}`);
    }
  }

  // Find a single document by ID
  async findById(id, options = {}) {
    try {
      const { select = '', populate = '', lean = false } = options;

      let query = this.model.findById(id);

      if (select) query = query.select(select);
      if (populate) query = query.populate(populate);
      if (lean) query = query.lean();

      return await query;
    } catch (error) {
      throw new Error(`Find by ID operation failed: ${error.message}`);
    }
  }

  // Find one document by filter
  async findOne(filter, options = {}) {
    try {
      const { select = '', populate = '', lean = false } = options;

      let query = this.model.findOne(filter);

      if (select) query = query.select(select);
      if (populate) query = query.populate(populate);
      if (lean) query = query.lean();

      return await query;
    } catch (error) {
      throw new Error(`Find one operation failed: ${error.message}`);
    }
  }

  // Update a document by ID
  async updateById(id, data, options = {}) {
    try {
      const { new: returnNew = true, runValidators = true } = options;

      return await this.model.findByIdAndUpdate(
        id,
        data,
        { new: returnNew, runValidators }
      );
    } catch (error) {
      throw new Error(`Update operation failed: ${error.message}`);
    }
  }

  // Delete a document by ID
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Delete operation failed: ${error.message}`);
    }
  }

  // Bulk operations
  async bulkCreate(dataArray) {
    try {
      return await this.model.insertMany(dataArray);
    } catch (error) {
      throw new Error(`Bulk create operation failed: ${error.message}`);
    }
  }

  async bulkUpdate(filter, update) {
    try {
      return await this.model.updateMany(filter, update);
    } catch (error) {
      throw new Error(`Bulk update operation failed: ${error.message}`);
    }
  }

  async bulkDelete(filter) {
    try {
      return await this.model.deleteMany(filter);
    } catch (error) {
      throw new Error(`Bulk delete operation failed: ${error.message}`);
    }
  }

  // Aggregation pipeline
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new Error(`Aggregation operation failed: ${error.message}`);
    }
  }

  // Count documents
  async count(filter = {}) {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      throw new Error(`Count operation failed: ${error.message}`);
    }
  }

  // Check if document exists
  async exists(filter) {
    try {
      return await this.model.exists(filter);
    } catch (error) {
      throw new Error(`Exists operation failed: ${error.message}`);
    }
  }
}

export default BaseService;