import express from 'express';
import {
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
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';
import { 
  validateProfileUpdate,
  validateUserStatus,
  validateUserRole,
  validateBulkUpdate
} from '../middleware/validation.js';

const router = express.Router();

// Protected user routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, validateProfileUpdate, updateUserProfile);
router.get('/sessions', protect, getUserSessions);

// Admin routes - User management
router.get('/', protect, admin, getAllUsers);
router.get('/export', protect, admin, exportUsers);
router.get('/search', protect, admin, searchUsers);
router.get('/stats', protect, admin, getUserStats);
router.get('/role/:role', protect, admin, getUsersByRole);
router.get('/account-type/:type', protect, admin, getUsersByAccountType);
router.get('/:id', protect, admin, getUserById);

// Admin routes - User modifications
router.patch('/bulk-update', protect, admin, validateBulkUpdate, bulkUpdateUsers);
router.patch('/:id/status', protect, admin, validateUserStatus, updateUserStatus);
router.patch('/:id/role', protect, admin, validateUserRole, updateUserRole);
router.delete('/:id', protect, admin, deleteUser);

export default router;