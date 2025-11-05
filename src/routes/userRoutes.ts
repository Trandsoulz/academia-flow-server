import { Router } from 'express';
import { getReviewers, getUserStats, getAllUsers, deactivateUser, activateUser } from '../controllers/userController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/userModel';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authorize(UserRole.ADMIN), getAllUsers);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate a user (shadow delete)
 * @access  Private (Admin only)
 */
router.put('/:id/deactivate', authorize(UserRole.ADMIN), deactivateUser);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activate a user (restore from shadow delete)
 * @access  Private (Admin only)
 */
router.put('/:id/activate', authorize(UserRole.ADMIN), activateUser);

/**
 * @route   GET /api/users/reviewers
 * @desc    Get all reviewers
 * @access  Private (Editor/Admin only)
 */
router.get('/reviewers', authorize(UserRole.EDITOR, UserRole.ADMIN), getReviewers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authorize(UserRole.ADMIN), getUserStats);

export default router;
