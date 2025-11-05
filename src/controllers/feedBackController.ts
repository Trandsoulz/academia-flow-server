import { Request, Response } from 'express';
import Feedback, { FeedbackCategory, FeedbackStatus } from '../models/feedBackModel';
import catchAsync from '../utils/catchAsync';

/**
 * @desc    Submit new feedback
 * @route   POST /api/feedback/submit
 * @access  Private (Author only)
 */
export const submitFeedback = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { title, category, description } = req.body;

  // Validate required fields
  if (!title || !category || !description) {
    res.status(400).json({
      success: false,
      message: 'Please provide title, category, and description',
    });
    return;
  }

  // Validate category
  if (!Object.values(FeedbackCategory).includes(category)) {
    res.status(400).json({
      success: false,
      message: 'Invalid category. Must be one of: Academic, Facility, Welfare, Technology, Administration, Other',
    });
    return;
  }

  // Get user from request (added by auth middleware)
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  // Create new feedback
  const feedback = await Feedback.create({
    title,
    category,
    description,
    studentId: userId,
    status: FeedbackStatus.PENDING,
  });

  // Populate user details
  await feedback.populate('studentId', 'fullname email');

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: {
      feedback,
    },
  });
});

/**
 * @desc    Get all feedbacks (for admin)
 * @route   GET /api/feedback/all
 * @access  Private (Admin only)
 */
export const getAllFeedbacks = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const feedbacks = await Feedback.find()
    .populate('studentId', 'fullname email')
    .populate('respondedBy', 'fullname email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Feedbacks retrieved successfully',
    data: {
      count: feedbacks.length,
      feedbacks,
    },
  });
});

/**
 * @desc    Get author's own feedbacks
 * @route   GET /api/feedback/my-feedbacks
 * @access  Private (Author only)
 */
export const getMyFeedbacks = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  const feedbacks = await Feedback.find({ studentId: userId })
    .populate('respondedBy', 'fullname email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Your feedbacks retrieved successfully',
    data: {
      count: feedbacks.length,
      feedbacks,
    },
  });
});

/**
 * @desc    Get single feedback by ID
 * @route   GET /api/feedback/:id
 * @access  Private
 */
export const getFeedbackById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const feedback = await Feedback.findById(id)
    .populate('studentId', 'fullname email')
    .populate('respondedBy', 'fullname email');

  if (!feedback) {
    res.status(404).json({
      success: false,
      message: 'Feedback not found',
    });
    return;
  }

  // Check if user is authorized to view this feedback
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (userRole !== 'admin' && feedback.studentId._id.toString() !== userId) {
    res.status(403).json({
      success: false,
      message: 'You are not authorized to view this feedback',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Feedback retrieved successfully',
    data: {
      feedback,
    },
  });
});

/**
 * @desc    Update feedback status and add admin response
 * @route   PUT /api/feedback/:id
 * @access  Private (Admin only)
 */
export const updateFeedback = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, adminResponse } = req.body;

  // Validate status if provided
  if (status && !Object.values(FeedbackStatus).includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: Pending, In Progress, Resolved',
    });
    return;
  }

  const feedback = await Feedback.findById(id);

  if (!feedback) {
    res.status(404).json({
      success: false,
      message: 'Feedback not found',
    });
    return;
  }

  // Update fields
  if (status) feedback.status = status;
  if (adminResponse) {
    feedback.adminResponse = adminResponse;
    feedback.respondedBy = req.user?.id as any;
    feedback.respondedAt = new Date();
  }

  await feedback.save();

  // Populate user and admin details
  await feedback.populate('studentId', 'fullname email');
  await feedback.populate('respondedBy', 'fullname email');

  res.status(200).json({
    success: true,
    message: 'Feedback updated successfully',
    data: {
      feedback,
    },
  });
});

/**
 * @desc    Delete feedback
 * @route   DELETE /api/feedback/:id
 * @access  Private (Admin only)
 */
export const deleteFeedback = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const feedback = await Feedback.findByIdAndDelete(id);

  if (!feedback) {
    res.status(404).json({
      success: false,
      message: 'Feedback not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Feedback deleted successfully',
  });
});
