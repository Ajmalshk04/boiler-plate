import BaseController from './BaseController.js';
import UserService from '../services/UserService.js';
import TokenService from '../services/TokenService.js';

class UserController extends BaseController {
  constructor() {
    super(UserService);
    this.searchFields = ['name', 'email']; // Fields to search across
  }

  // Set secure cookie options
  getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  // Get device info from request
  getDeviceInfo(req) {
    return {
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      deviceId: req.get('X-Device-ID') || 'unknown'
    };
  }

  // @desc    Register new user
  // @route   POST /api/users/register
  // @access  Public
  async registerUser(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await this.service.findByEmail(email);
      if (existingUser) {
        return this.errorResponse(res, 'User already exists with this email', 400);
      }

      // Create user
      const user = await this.service.create({
        name,
        email,
        password
      });

      // Generate tokens
      const deviceInfo = this.getDeviceInfo(req);
      const tokens = await TokenService.createTokenPair(user._id, deviceInfo);

      // Set refresh token as secure cookie
      res.cookie('refreshToken', tokens.refreshToken, this.getCookieOptions());

      this.successResponse(res, {
        user,
        accessToken: tokens.accessToken,
        accessTokenExpiry: tokens.accessTokenExpiry
      }, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // @desc    Login user
  // @route   POST /api/users/login
  // @access  Public
  async loginUser(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await this.service.findByEmail(email, { select: '+password' });
      if (!user) {
        return this.errorResponse(res, 'Invalid credentials', 401);
      }

      // Check if user is active
      if (!user.isActive) {
        return this.errorResponse(res, 'Account is deactivated', 401);
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return this.errorResponse(res, 'Invalid credentials', 401);
      }

      // Generate tokens
      const deviceInfo = this.getDeviceInfo(req);
      const tokens = await TokenService.createTokenPair(user._id, deviceInfo);

      // Set refresh token as secure cookie
      res.cookie('refreshToken', tokens.refreshToken, this.getCookieOptions());

      this.successResponse(res, {
        user: user.toJSON(),
        accessToken: tokens.accessToken,
        accessTokenExpiry: tokens.accessTokenExpiry
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  } 
 // @desc    Refresh tokens
  // @route   POST /api/users/refresh
  // @access  Public
  async refreshTokens(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return this.errorResponse(res, 'Refresh token not provided', 401);
      }

      const deviceInfo = this.getDeviceInfo(req);
      const tokens = await TokenService.refreshTokens(refreshToken, deviceInfo);

      // Set new refresh token as secure cookie
      res.cookie('refreshToken', tokens.refreshToken, this.getCookieOptions());

      this.successResponse(res, {
        accessToken: tokens.accessToken,
        accessTokenExpiry: tokens.accessTokenExpiry
      }, 'Tokens refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Logout user
  // @route   POST /api/users/logout
  // @access  Private
  async logoutUser(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await TokenService.revokeToken(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      this.successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Logout from all devices
  // @route   POST /api/users/logout-all
  // @access  Private
  async logoutAllDevices(req, res, next) {
    try {
      await TokenService.revokeAllUserTokens(req.user.userId);
      
      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      this.successResponse(res, null, 'Logged out from all devices');
    } catch (error) {
      next(error);
    }
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

      const { name, email, avatar } = req.body;
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

      const user = await this.service.updateById(userId, { name, email, avatar });

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

  // @desc    Get user statistics
  // @route   GET /api/users/stats
  // @access  Private/Admin
  async getUserStats(req, res, next) {
    try {
      const stats = await this.service.getUserStats();
      this.successResponse(res, stats, 'User statistics retrieved successfully');
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

  // @desc    Update user status (Admin only)
  // @route   PATCH /api/users/:id/status
  // @access  Private/Admin
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await this.service.updateUserStatus(id, isActive);
      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      // If deactivating user, revoke all their tokens
      if (!isActive) {
        await TokenService.revokeAllUserTokens(id);
      }

      this.successResponse(res, { user }, 'User status updated successfully');
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
}

// Create and export instance
const userController = new UserController();

export const {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  logoutAllDevices,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  searchUsers,
  getUsersByRole,
  getUserStats,
  getUserSessions,
  updateUserStatus,
  deleteUser
} = userController;

export default userController;