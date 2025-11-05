import { Request, Response } from 'express';
import Notification from '../models/notificationModel';
import catchAsync from '../utils/catchAsync';

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  // Get query parameters
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = parseInt(req.query.skip as string) || 0;
  const unreadOnly = req.query.unreadOnly === 'true';

  // Build query
  const query: any = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  // Fetch notifications
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  // Get total count
  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      total,
      unreadCount,
    },
  });
});

/**
 * @desc    Create a new notification
 * @route   POST /api/notifications
 * @access  Private (Admin/System)
 */
export const createNotification = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { userId, message } = req.body;

  // Validate required fields
  if (!userId || !message) {
    res.status(400).json({
      success: false,
      message: 'Please provide userId and message',
    });
    return;
  }

  // Create notification
  const notification = await Notification.create({
    userId,
    message,
  });

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: {
      notification,
    },
  });
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;

  // Find notification and ensure it belongs to the user
  const notification = await Notification.findOne({ _id: id, userId });

  if (!notification) {
    res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
    return;
  }

  // Mark as read
  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: {
      notification,
    },
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  // Update all unread notifications
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: {
      modifiedCount: result.modifiedCount,
    },
  });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;

  // Find and delete notification (ensure it belongs to the user)
  const notification = await Notification.findOneAndDelete({ _id: id, userId });

  if (!notification) {
    res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

/**
 * @desc    Delete all notifications for the logged-in user
 * @route   DELETE /api/notifications/all
 * @access  Private
 */
export const deleteAllNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  // Delete all notifications for the user
  const result = await Notification.deleteMany({ userId });

  res.status(200).json({
    success: true,
    message: 'All notifications deleted successfully',
    data: {
      deletedCount: result.deletedCount,
    },
  });
});
