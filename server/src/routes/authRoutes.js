import express from 'express';
import {
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
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';
import { 
  validateRegister, 
  validateLogin,
  validateAdminLogin,
  validateOTP,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validation.js';

const router = express.Router();

// Public authentication routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/verify-otp', validateOTP, verifyOTP);
router.post('/refresh', refreshTokens);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected authentication routes
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAllDevices);

// Admin authentication routes
router.post('/admin/login', validateAdminLogin, adminLogin);
router.post('/admin/refresh', adminRefreshTokens);
router.post('/admin/logout', protect, admin, adminLogout);

export default router;