import express from 'express';
import {
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
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';
import { 
  validateRegister, 
  validateLogin, 
  validateProfileUpdate,
  validateUserStatus 
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/refresh', refreshTokens);

// Protected routes
router.post('/logout', protect, logoutUser);
router.post('/logout-all', protect, logoutAllDevices);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, validateProfileUpdate, updateUserProfile);
router.get('/sessions', protect, getUserSessions);

// Admin routes
router.get('/', protect, admin, getAllUsers);
router.get('/search', protect, admin, searchUsers);
router.get('/role/:role', protect, admin, getUsersByRole);
router.get('/stats', protect, admin, getUserStats);
router.patch('/:id/status', protect, admin, validateUserStatus, updateUserStatus);
router.delete('/:id', protect, admin, deleteUser);

export default router;