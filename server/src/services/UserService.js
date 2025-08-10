import BaseService from './BaseService.js';
import User from '../models/User.js';

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  // Find user by email
  async findByEmail(email, options = {}) {
    return await this.findOne({ email }, options);
  }

  // Find active users
  async findActiveUsers(options = {}) {
    const filter = { isActive: true, ...options.filter };
    return await this.findAll({ ...options, filter });
  }

  // Search users by name or email
  async searchUsers(searchTerm, options = {}) {
    const filter = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ],
      ...options.filter
    };
    return await this.findAll({ ...options, filter });
  }

  // Get users by role
  async getUsersByRole(role, options = {}) {
    const filter = { role, ...options.filter };
    return await this.findAll({ ...options, filter });
  }

  // Update user status
  async updateUserStatus(userId, isActive) {
    return await this.updateById(userId, { isActive });
  }

  // Get user statistics
  async getUserStats() {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          activeUsers: 1,
          inactiveUsers: { $subtract: ['$totalUsers', '$activeUsers'] },
          adminUsers: 1,
          regularUsers: { $subtract: ['$totalUsers', '$adminUsers'] }
        }
      }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      adminUsers: 0,
      regularUsers: 0
    };
  }

  // Get users registered in date range
  async getUsersInDateRange(startDate, endDate, options = {}) {
    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      ...options.filter
    };
    return await this.findAll({ ...options, filter });
  }
}

export default new UserService();