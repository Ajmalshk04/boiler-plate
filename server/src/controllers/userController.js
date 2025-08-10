import BaseController from './BaseController.js';
import UserService from '../services/UserService.js';
import TokenService from '../services/TokenService.js';

class UserController extends BaseController {
  constructor() {
    super(UserService);
    this.searchFields = ['name', 'email', 'mobile']; // Fields to search across
  }

  // @desc    Get user profile
  // @route   GET /api/users/profile
  // @access  Private
  async getUserProfile(req, res, next) {
    try {
      const user = await this.service.findById(req.user.userId);
      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      this.successResponse(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update user profile
  // @route   PUT /api/users/profile
  // @access  Private
  async updateUserProfile(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const { name, email, mobile, avatar, companyName, gstinNo, getWhatsappUpdate } = req.body;
      const userId = req.user.userId;

      // Check if email is being changed and if it's already taken
      if (email) {
        const existingUser = await this.service.findOne({
          email,
          _id: { $ne: userId }
        });
        if (existingUser) {
          return this.errorResponse(res, 'Email already in use', 400);
        }
      }

      // Check if mobile is being changed and if it's already taken
      if (mobile) {
        const existingUser = await this.service.findOne({
          mobile,
          _id: { $ne: userId }
        });
        if (existingUser) {
          return this.errorResponse(res, 'Mobile number already in use', 400);
        }
      }

      const updateData = { name, email, mobile, avatar, companyName, gstinNo, getWhatsappUpdate };

      // Remove undefined values
      Object.keys(updateData).forEach(key =>
        updateData[key] === undefined && delete updateData[key]
      );

      const user = await this.service.updateById(userId, updateData);

      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      this.successResponse(res, { user }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get all users (Admin only) - Enhanced with advanced querying
  // @route   GET /api/users
  // @access  Private/Admin
  async getAllUsers(req, res, next) {
    try {
      const options = this.parseQueryParams(req.query);
      const result = await this.service.findAll(options);

      this.successResponse(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Search users
  // @route   GET /api/users/search
  // @access  Private/Admin
  async searchUsers(req, res, next) {
    try {
      const { q: searchTerm } = req.query;
      if (!searchTerm) {
        return this.errorResponse(res, 'Search term is required', 400);
      }

      const options = this.parseQueryParams(req.query);
      const result = await this.service.searchUsers(searchTerm, options);

      this.successResponse(res, result, 'Search completed successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get users by role
  // @route   GET /api/users/role/:role
  // @access  Private/Admin
  async getUsersByRole(req, res, next) {
    try {
      const { role } = req.params;
      const options = this.parseQueryParams(req.query);
      const result = await this.service.getUsersByRole(role, options);

      this.successResponse(res, result, `${role} users retrieved successfully`);
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get users by account type
  // @route   GET /api/users/account-type/:type
  // @access  Private/Admin
  async getUsersByAccountType(req, res, next) {
    try {
      const { type } = req.params;
      const options = this.parseQueryParams(req.query);
      const filter = { accountType: type, ...options.filter };
      const result = await this.service.findAll({ ...options, filter });

      this.successResponse(res, result, `${type} users retrieved successfully`);
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get user statistics
  // @route   GET /api/users/stats
  // @access  Private/Admin
  async getUserStats(req, res, next) {
    try {
      const stats = await this.service.getUserStats();

      // Additional stats
      const accountTypeStats = await this.service.aggregate([
        {
          $group: {
            _id: '$accountType',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusStats = await this.service.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const enhancedStats = {
        ...stats,
        accountTypes: accountTypeStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        statuses: statusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };

      this.successResponse(res, enhancedStats, 'User statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get active user sessions
  // @route   GET /api/users/sessions
  // @access  Private
  async getUserSessions(req, res, next) {
    try {
      const sessions = await TokenService.getUserActiveSessions(req.user.userId);
      this.successResponse(res, sessions, 'Active sessions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get user by ID (Admin only)
  // @route   GET /api/users/:id
  // @access  Private/Admin
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const { fields, populate } = req.query;

      const options = {
        select: fields ? fields.split(',').join(' ') : '',
        populate: populate || ''
      };

      const user = await this.service.findById(id, options);

      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      this.successResponse(res, { user }, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update user status (Admin only)
  // @route   PATCH /api/users/:id/status
  // @access  Private/Admin
  async updateUserStatus(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const { id } = req.params;
      const { isActive, status } = req.body;

      const updateData = {};
      if (isActive !== undefined) updateData.isActive = isActive;
      if (status !== undefined) updateData.status = status;

      const user = await this.service.updateById(id, updateData);
      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      // If deactivating user, revoke all their tokens
      if (isActive === false || status === 'locked' || status === 'suspended') {
        await TokenService.revokeAllUserTokens(id);
      }

      this.successResponse(res, { user }, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update user role (Admin only)
  // @route   PATCH /api/users/:id/role
  // @access  Private/Admin
  async updateUserRole(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const { id } = req.params;
      const { role } = req.body;

      const user = await this.service.updateById(id, { role });
      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      // Revoke all tokens to force re-login with new role
      await TokenService.revokeAllUserTokens(id);

      this.successResponse(res, { user }, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Delete user (Admin only)
  // @route   DELETE /api/users/:id
  // @access  Private/Admin
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await this.service.findById(id);
      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      // Revoke all user tokens before deletion
      await TokenService.revokeAllUserTokens(id);

      // Delete user
      await this.service.deleteById(id);

      this.successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Bulk update users (Admin only)
  // @route   PATCH /api/users/bulk-update
  // @access  Private/Admin
  async bulkUpdateUsers(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const { userIds, updateData } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return this.errorResponse(res, 'User IDs array is required', 400);
      }

      const result = await this.service.bulkUpdate(
        { _id: { $in: userIds } },
        updateData
      );

      // If deactivating users, revoke their tokens
      if (updateData.isActive === false ||
        updateData.status === 'locked' ||
        updateData.status === 'suspended') {
        for (const userId of userIds) {
          await TokenService.revokeAllUserTokens(userId);
        }
      }

      this.successResponse(res, result, 'Users updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Export users (Admin only)
  // @route   GET /api/users/export
  // @access  Private/Admin
  async exportUsers(req, res, next) {
    try {
      const options = this.parseQueryParams(req.query);
      options.limit = 10000; // Large limit for export

      const result = await this.service.findAll(options);

      // Format data for export
      const exportData = result.data.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        accountType: user.accountType,
        companyName: user.companyName,
        status: user.status,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=users-export.json');

      this.successResponse(res, exportData, 'Users exported successfully');
    } catch (error) {
      next(error);
    }
  }
}

// Create and export instance
const userController = new UserController();

export const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  searchUsers,
  getUsersByRole,
  getUsersByAccountType,
  getUserStats,
  getUserSessions,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  bulkUpdateUsers,
  exportUsers
} = userController;

export default userController;