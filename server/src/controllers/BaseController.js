import { validationResult } from 'express-validator';

class BaseController {
  constructor(service) {
    this.service = service;
  }

  // Handle validation errors
  handleValidationErrors(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }
  }

  // Success response helper
  successResponse(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Error response helper
  errorResponse(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Parse query parameters for advanced filtering
  parseQueryParams(query) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      fields,
      populate,
      ...filters
    } = query;

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Build filter object
    const filter = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        // Handle different filter types
        if (key.endsWith('_gte')) {
          const field = key.replace('_gte', '');
          filter[field] = { ...filter[field], $gte: filters[key] };
        } else if (key.endsWith('_lte')) {
          const field = key.replace('_lte', '');
          filter[field] = { ...filter[field], $lte: filters[key] };
        } else if (key.endsWith('_in')) {
          const field = key.replace('_in', '');
          filter[field] = { $in: filters[key].split(',') };
        } else if (key.endsWith('_regex')) {
          const field = key.replace('_regex', '');
          filter[field] = { $regex: filters[key], $options: 'i' };
        } else {
          filter[key] = filters[key];
        }
      }
    });

    // Handle search across multiple fields
    if (search && this.searchFields) {
      filter.$or = this.searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }

    return {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 items per page
      sort: sortObj,
      filter,
      select: fields ? fields.split(',').join(' ') : '',
      populate: populate || ''
    };
  }

  // Generic CRUD operations
  async create(req, res, next) {
    try {
      this.handleValidationErrors(req);
      
      const data = await this.service.create(req.body);
      this.successResponse(res, data, 'Resource created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const options = this.parseQueryParams(req.query);
      const result = await this.service.findAll(options);
      
      this.successResponse(res, result, 'Resources retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const { id } = req.params;
      const { fields, populate } = req.query;
      
      const options = {
        select: fields ? fields.split(',').join(' ') : '',
        populate: populate || ''
      };
      
      const data = await this.service.findById(id, options);
      
      if (!data) {
        return this.errorResponse(res, 'Resource not found', 404);
      }
      
      this.successResponse(res, data, 'Resource retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateById(req, res, next) {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const data = await this.service.updateById(id, req.body);
      
      if (!data) {
        return this.errorResponse(res, 'Resource not found', 404);
      }
      
      this.successResponse(res, data, 'Resource updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.service.deleteById(id);
      
      if (!data) {
        return this.errorResponse(res, 'Resource not found', 404);
      }
      
      this.successResponse(res, null, 'Resource deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Bulk operations
  async bulkCreate(req, res, next) {
    try {
      this.handleValidationErrors(req);
      
      const data = await this.service.bulkCreate(req.body);
      this.successResponse(res, data, 'Resources created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdate(req, res, next) {
    try {
      this.handleValidationErrors(req);
      
      const { filter, update } = req.body;
      const result = await this.service.bulkUpdate(filter, update);
      
      this.successResponse(res, result, 'Resources updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async bulkDelete(req, res, next) {
    try {
      const { filter } = req.body;
      const result = await this.service.bulkDelete(filter);
      
      this.successResponse(res, result, 'Resources deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Statistics
  async getStats(req, res, next) {
    try {
      const stats = await this.service.count();
      this.successResponse(res, { total: stats }, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default BaseController;