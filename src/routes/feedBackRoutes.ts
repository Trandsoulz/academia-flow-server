import express from 'express';
import {
  submitFeedback,
  getAllFeedbacks,
  getMyFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
} from '../controllers/feedBackController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/userModel';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Author routes (authors can submit feedback)
router.post('/submit', authorize(UserRole.AUTHOR), submitFeedback);
router.get('/my-feedbacks', authorize(UserRole.AUTHOR), getMyFeedbacks);

// Admin routes
router.get('/all', authorize(UserRole.ADMIN), getAllFeedbacks);
router.route('/:id')
  .get(getFeedbackById) // Both admin and author can view (authorization checked in controller)
  .put(authorize(UserRole.ADMIN), updateFeedback)
  .delete(authorize(UserRole.ADMIN), deleteFeedback);

export default router;
