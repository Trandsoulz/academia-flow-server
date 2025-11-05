import express from 'express';
import {
  submitManuscript,
  getMyManuscripts,
  getManuscriptById,
  getAllManuscripts,
  assignReviewers,
  updateManuscriptStatus,
  getAssignedManuscripts,
  submitReview,
  makeDecision,
  getManuscriptReviews,
  getReviewerStats,
  getAuthorStats,
} from '../controllers/manuscriptController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/userModel';
import { uploadManuscript } from '../configs/multerConfig';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Author routes - submit and view their own manuscripts
router.post('/submit', authorize(UserRole.AUTHOR), uploadManuscript.single('file'), submitManuscript);
router.get('/my-manuscripts', authorize(UserRole.AUTHOR), getMyManuscripts);
router.get('/author-stats', authorize(UserRole.AUTHOR), getAuthorStats);

// Reviewer routes - view assigned manuscripts
router.get('/assigned-to-me', authorize(UserRole.REVIEWER), getAssignedManuscripts);
router.post('/:id/submit-review', authorize(UserRole.REVIEWER), submitReview);
router.get('/reviewer-stats', authorize(UserRole.REVIEWER), getReviewerStats);

// Editor/Admin routes - manage all manuscripts
router.get('/', authorize(UserRole.EDITOR, UserRole.ADMIN), getAllManuscripts);
router.put('/:id/assign-reviewers', authorize(UserRole.EDITOR, UserRole.ADMIN), assignReviewers);
router.put('/:id/status', authorize(UserRole.EDITOR, UserRole.ADMIN), updateManuscriptStatus);
router.put('/:id/decision', authorize(UserRole.EDITOR, UserRole.ADMIN), makeDecision);
router.get('/:id/reviews', authorize(UserRole.EDITOR, UserRole.ADMIN), getManuscriptReviews);

// Any authenticated user can view a specific manuscript
router.get('/:id', getManuscriptById);

export default router;
