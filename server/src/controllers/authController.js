import BaseController from './BaseController.js';
import UserService from '../services/UserService.js';
import TokenService from '../services/TokenService.js';
import { setAuthCookies, clearTokenCookie, setCRMAuthCookies, clearCRMTokenCookie } from '../utils/cookieHelpers.js';
import { generateTokens, generateAdminTokens } from '../utils/tokenHelpers.js';

class AuthController extends BaseController {
  constructor() {
    super(UserService);
  }

  // Get device info from request
  getDeviceInfo(req) {
    return {
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      deviceId: req.get('X-Device-ID') || 'unknown'
    };
  }

  // Update login history
  async updateLoginHistory(user, req) {
    try {
      const loginData = {
        timestamp: new Date(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        deviceId: req.get('X-Device-ID') || 'unknown'
      };

      if (!user.loginHistory) {
        user.loginHistory = [];
      }

      user.loginHistory.unshift(loginData);
      
      // Keep only last 10 login records
      if (user.loginHistory.length > 10) {
        user.loginHistory = user.loginHistory.slice(0, 10);
      }

      user.lastLogin = new Date();
      await user.save();
    } catch (error) {
      console.error('Error updating login history:', error);
    }
  }

  // @desc    Register new user
  // @route   POST /api/auth/register
  // @access  Public
  async register(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const {
        name,
        email,
        password,
        mobile,
        accountType,
        getWhatsappUpdate,
        acceptTermsAndConditions,
        companyName,
        gstinNo,
        otp
      } = req.body;

      // If OTP is provided, delegate to verifyOTP
      if (otp) {
        req.body = { email, mobile, otp };
        return this.verifyOTP(req, res, next);
      }

      // Initial registration request
      if (!email || !mobile || !password || !acceptTermsAndConditions) {
        return this.errorResponse(res, 'Please provide email, mobile, password, and accept terms', 400);
      }

      if (password.length < 8) {
        return this.errorResponse(res, 'Password must be at least 8 characters long', 400);
      }

      // Check if user with same email OR mobile already exists
      const existingUser = await this.service.findOne({
        $or: [{ email }, { mobile }]
      });

      if (existingUser) {
        return this.errorResponse(res, 'User already exists with this Email/Mobile.', 400);
      }

      // Create new user
      const user = await this.service.create({
        name,
        email,
        password,
        mobile,
        accountType: accountType || 'Individual',
        getWhatsappUpdate: getWhatsappUpdate || false,
        acceptTermsAndConditions,
        isActive: false, // User needs to verify OTP first
        companyName: accountType === 'Corporate' ? companyName : undefined,
        gstinNo: accountType === 'Corporate' ? gstinNo : undefined,
      });

      // Generate and store OTP (you'll need to implement OTP service)
      // const otpData = generateOTPWithExpiry();
      // user.otp = {
      //   ...otpData,
      //   attempts: 0,
      //   maxAttempts: 10,
      //   purpose: 'registration',
      //   lastAttemptAt: new Date(),
      // };
      // await user.save();

      // For now, just return success without OTP
      this.successResponse(res, {
        message: 'Registration successful. Please verify your account.',
        userId: user._id
      }, 'User registered successfully', 201);

    } catch (error) {
      next(error);
    }
  }

  // @desc    Login user
  // @route   POST /api/auth/login
  // @access  Public
  async login(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const { contact, password, otp } = req.body;

      if (!contact || (!password && !otp)) {
        return this.errorResponse(res, 'Contact (email/mobile) and either password or OTP are required', 400);
      }

      let user;
      if (contact.includes('@')) {
        user = await this.service.findByEmail(contact, { select: '+password' });
      } else {
        user = await this.service.findOne({ mobile: contact }, { select: '+password' });
      }

      if (!user) {
        return this.errorResponse(res, 'User not found', 401);
      }

      if (password) {
        // Password-based login
        if (password.length < 8) {
          return this.errorResponse(res, 'Password must be at least 8 characters long', 400);
        }

        // Check if account is locked
        if (user.status === 'locked') {
          return this.errorResponse(res, 'Account is locked due to multiple failed login attempts', 401);
        }

        // Check if account is verified
        if (!user.isActive) {
          return this.errorResponse(res, 'Verify your account first', 401);
        }

        // Track login attempts
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts > 3) {
          user.status = 'locked';
          await user.save();
          return this.errorResponse(res, 'Account locked due to multiple failed login attempts', 401);
        }

        if (!(await user.comparePassword(password))) {
          await user.save();
          return this.errorResponse(res, 'Invalid password', 401);
        }

        // Reset login attempts on successful login
        user.loginAttempts = 0;
        await this.updateLoginHistory(user, req);

        const { accessToken, refreshToken } = await generateTokens(user._id);
        setAuthCookies(res, accessToken, refreshToken);

        user.password = undefined;
        this.successResponse(res, { user }, 'Login successful');

      } else if (otp) {
        // OTP-based login
        const { email, mobile } = contact.includes('@')
          ? { email: contact, mobile: null }
          : { email: null, mobile: contact };
        
        req.body = { email, mobile, otp };
        return this.verifyOTP(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  }

  // @desc    Admin login
  // @route   POST /api/auth/admin/login
  // @access  Public
  async adminLogin(req, res, next) {
    try {
      this.handleValidationErrors(req);

      const { email, password } = req.body;

      const user = await this.service.findByEmail(email, { select: '+password' });
      if (!user || user.role !== 'admin') {
        return this.errorResponse(res, 'Invalid admin credentials', 401);
      }

      if (!user.isActive) {
        return this.errorResponse(res, 'Admin account is deactivated', 401);
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return this.errorResponse(res, 'Invalid admin credentials', 401);
      }

      await this.updateLoginHistory(user, req);

      const { accessToken, refreshToken } = await generateAdminTokens(user._id, user.role);
      setCRMAuthCookies(res, accessToken, refreshToken);

      user.password = undefined;
      this.successResponse(res, { user }, 'Admin login successful');

    } catch (error) {
      next(error);
    }
  }

  // @desc    Refresh tokens
  // @route   POST /api/auth/refresh
  // @access  Public
  async refreshTokens(req, res, next) {
    try {
      const refreshToken = req.signedCookies._nw_rt || req.body.refreshToken;
      
      if (!refreshToken) {
        return this.errorResponse(res, 'Refresh token not provided', 401);
      }

      const deviceInfo = this.getDeviceInfo(req);
      const tokens = await TokenService.refreshTokens(refreshToken, deviceInfo);

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      this.successResponse(res, {
        accessToken: tokens.accessToken,
        accessTokenExpiry: tokens.accessTokenExpiry
      }, 'Tokens refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Admin refresh tokens
  // @route   POST /api/auth/admin/refresh
  // @access  Public
  async adminRefreshTokens(req, res, next) {
    try {
      const refreshToken = req.signedCookies.c_nw_rt || req.body.refreshToken;
      
      if (!refreshToken) {
        return this.errorResponse(res, 'Admin refresh token not provided', 401);
      }

      const deviceInfo = this.getDeviceInfo(req);
      const tokens = await TokenService.refreshTokens(refreshToken, deviceInfo);

      setCRMAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      this.successResponse(res, {
        accessToken: tokens.accessToken,
        accessTokenExpiry: tokens.accessTokenExpiry
      }, 'Admin tokens refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Logout user
  // @route   POST /api/auth/logout
  // @access  Private
  async logout(req, res, next) {
    try {
      const refreshToken = req.signedCookies._nw_rt;
      
      if (refreshToken) {
        await TokenService.revokeToken(refreshToken);
      }

      clearTokenCookie(res);
      this.successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Admin logout
  // @route   POST /api/auth/admin/logout
  // @access  Private
  async adminLogout(req, res, next) {
    try {
      const refreshToken = req.signedCookies.c_nw_rt;
      
      if (refreshToken) {
        await TokenService.revokeToken(refreshToken);
      }

      clearCRMTokenCookie(res);
      this.successResponse(res, null, 'Admin logout successful');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Logout from all devices
  // @route   POST /api/auth/logout-all
  // @access  Private
  async logoutAllDevices(req, res, next) {
    try {
      await TokenService.revokeAllUserTokens(req.user.userId);
      
      clearTokenCookie(res);
      this.successResponse(res, null, 'Logged out from all devices');
    } catch (error) {
      next(error);
    }
  }

  // @desc    Verify OTP
  // @route   POST /api/auth/verify-otp
  // @access  Public
  async verifyOTP(req, res, next) {
    try {
      const { email, mobile, otp } = req.body;

      if (!otp) {
        return this.errorResponse(res, 'OTP is required', 400);
      }

      let user;
      if (email) {
        user = await this.service.findByEmail(email);
      } else if (mobile) {
        user = await this.service.findOne({ mobile });
      }

      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      // Here you would verify the OTP
      // For now, just activate the user
      if (!user.isActive) {
        user.isActive = true;
        await user.save();
      }

      await this.updateLoginHistory(user, req);

      const { accessToken, refreshToken } = await generateTokens(user._id);
      setAuthCookies(res, accessToken, refreshToken);

      this.successResponse(res, { user }, 'OTP verified successfully');

    } catch (error) {
      next(error);
    }
  }

  // @desc    Forgot password
  // @route   POST /api/auth/forgot-password
  // @access  Public
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return this.errorResponse(res, 'Email is required', 400);
      }

      const user = await this.service.findByEmail(email);
      if (!user) {
        return this.errorResponse(res, 'User not found', 404);
      }

      // Generate password reset token (implement this)
      // const resetToken = generatePasswordResetToken();
      // user.passwordResetToken = resetToken;
      // user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      // await user.save();

      // Send password reset email (implement this)
      // await sendPasswordResetEmail(user.email, resetToken);

      this.successResponse(res, null, 'Password reset link sent to your email');

    } catch (error) {
      next(error);
    }
  }

  // @desc    Reset password
  // @route   POST /api/auth/reset-password
  // @access  Public
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return this.errorResponse(res, 'Token and new password are required', 400);
      }

      if (newPassword.length < 8) {
        return this.errorResponse(res, 'Password must be at least 8 characters long', 400);
      }

      // Find user by reset token (implement this)
      // const user = await this.service.findOne({
      //   passwordResetToken: token,
      //   passwordResetExpires: { $gt: Date.now() }
      // });

      // if (!user) {
      //   return this.errorResponse(res, 'Invalid or expired reset token', 400);
      // }

      // user.password = newPassword;
      // user.passwordResetToken = undefined;
      // user.passwordResetExpires = undefined;
      // await user.save();

      this.successResponse(res, null, 'Password reset successful');

    } catch (error) {
      next(error);
    }
  }
}

// Create and export instance
const authController = new AuthController();

export const {
  register,
  login,
  adminLogin,
  refreshTokens,
  adminRefreshTokens,
  logout,
  adminLogout,
  logoutAllDevices,
  verifyOTP,
  forgotPassword,
  resetPassword
} = authController;

export default authController;