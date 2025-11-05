import { Router } from 'express';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notificationController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/userModel';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the logged-in user
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Private (Admin only)
 */
router.post('/', authorize(UserRole.ADMIN), createNotification);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', markAllAsRead);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', markAsRead);

/**
 * @route   DELETE /api/notifications/all
 * @desc    Delete all notifications for the logged-in user
 * @access  Private
 */
router.delete('/all', deleteAllNotifications);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

export default router;
