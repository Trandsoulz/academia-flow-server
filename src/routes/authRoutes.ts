import { Router } from 'express';
import { signup, signin, getMe, updateProfile } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/signin
 * @desc    Login user
 * @access  Public
 */
router.post('/signin', signin);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PATCH /api/auth/update-profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/update-profile', protect, updateProfile);

export default router;
