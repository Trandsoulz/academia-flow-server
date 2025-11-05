import { Request, Response } from 'express';
import Manuscript, { ManuscriptStatus } from '../models/manuscriptModel';
import User, { UserRole } from '../models/userModel';
import Review from '../models/reviewModel';
import Notification from '../models/notificationModel';
import catchAsync from '../utils/catchAsync';

/**
 * @desc    Submit new manuscript
 * @route   POST /api/manuscripts/submit
 * @access  Private (Author only)
 */
export const submitManuscript = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { title, abstract, keywords, authors } = req.body;

  // Check if file was uploaded
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'Please upload a manuscript file (PDF or DOCX)',
    });
    return;
  }

  // Validate required fields
  if (!title || !abstract || !keywords || !authors) {
    res.status(400).json({
      success: false,
      message: 'Please provide all required fields: title, abstract, keywords, and authors',
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

  // Get file information
  const fileName = req.file.originalname;
  const fileUrl = `/uploads/manuscripts/${req.file.filename}`;

  // Create new manuscript
  const manuscript = await Manuscript.create({
    title,
    abstract,
    keywords,
    authors,
    fileName,
    fileUrl,
    submittedBy: userId,
    status: ManuscriptStatus.SUBMITTED,
    assignedReviewers: [],
  });

  // Get author's name for the notification
  const author = await User.findById(userId).select('fullname');
  const authorName = author?.fullname || 'An author';

  // Create notification for the author
  await Notification.create({
    userId,
    message: `Your manuscript "${title}" has been submitted successfully and is awaiting review.`,
  });

  // Create notifications for all admins and editors
  const adminsAndEditors = await User.find({ 
    role: { $in: [UserRole.ADMIN, UserRole.EDITOR] } 
  }).select('_id');
  
  const notificationPromises = adminsAndEditors.map(user => 
    Notification.create({
      userId: user._id,
      message: `New manuscript submission: "${title}" by ${authorName}`,
    })
  );

  await Promise.all(notificationPromises);

  res.status(201).json({
    success: true,
    message: 'Manuscript submitted successfully',
    data: {
      manuscript: {
        id: manuscript._id,
        title: manuscript.title,
        abstract: manuscript.abstract,
        keywords: manuscript.keywords,
        authors: manuscript.authors,
        fileName: manuscript.fileName,
        fileUrl: manuscript.fileUrl,
        status: manuscript.status,
        submittedAt: manuscript.createdAt,
      },
    },
  });
});

/**
 * @desc    Get all manuscripts for the logged-in author
 * @route   GET /api/manuscripts/my-manuscripts
 * @access  Private (Author only)
 */
export const getMyManuscripts = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  const manuscripts = await Manuscript.find({ submittedBy: userId })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Manuscripts retrieved successfully',
    data: {
      count: manuscripts.length,
      manuscripts,
    },
  });
});

/**
 * @desc    Get single manuscript by ID
 * @route   GET /api/manuscripts/:id
 * @access  Private
 */
export const getManuscriptById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const manuscript = await Manuscript.findById(id)
    .populate('submittedBy', 'fullname email university department')
    .populate('assignedReviewers', 'fullname email');

  if (!manuscript) {
    res.status(404).json({
      success: false,
      message: 'Manuscript not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      manuscript,
    },
  });
});

/**
 * @desc    Get all manuscripts (for editor/admin)
 * @route   GET /api/manuscripts
 * @access  Private (Editor/Admin only)
 */
export const getAllManuscripts = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const manuscripts = await Manuscript.find()
    .populate('submittedBy', 'fullname email')
    .populate('assignedReviewers', 'fullname email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'All manuscripts retrieved successfully',
    data: {
      count: manuscripts.length,
      manuscripts,
    },
  });
});

/**
 * @desc    Assign reviewers to manuscript
 * @route   PUT /api/manuscripts/:id/assign-reviewers
 * @access  Private (Editor/Admin only)
 */
export const assignReviewers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reviewerIds } = req.body;

  if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Please provide an array of reviewer IDs',
    });
    return;
  }

  // Verify manuscript exists
  const manuscript = await Manuscript.findById(id);

  if (!manuscript) {
    res.status(404).json({
      success: false,
      message: 'Manuscript not found',
    });
    return;
  }

  // Verify all reviewer IDs are valid and have reviewer role
  const reviewers = await User.find({ 
    _id: { $in: reviewerIds },
    role: UserRole.REVIEWER,
    isActive: true 
  });

  if (reviewers.length !== reviewerIds.length) {
    res.status(400).json({
      success: false,
      message: 'One or more invalid reviewer IDs or reviewers are not active',
    });
    return;
  }

  // Assign reviewers and update status
  manuscript.assignedReviewers = reviewerIds;
  manuscript.status = ManuscriptStatus.UNDER_REVIEW;
  await manuscript.save();

  const updatedManuscript = await Manuscript.findById(id)
    .populate('assignedReviewers', 'fullname email university department')
    .populate('submittedBy', 'fullname email');

  // Get editor's name
  const editor = await User.findById(req.user?.id).select('fullname');
  const editorName = editor?.fullname || 'An editor';

  // Get author details
  const author = await User.findById(manuscript.submittedBy).select('fullname');
  const authorName = author?.fullname || 'Unknown author';

  // Create notification for the author
  await Notification.create({
    userId: manuscript.submittedBy,
    message: `Your manuscript "${manuscript.title}" has been assigned to reviewers and is now under review.`,
  });

  // Create notifications for each assigned reviewer
  const reviewerNotifications = reviewerIds.map((reviewerId: string) => 
    Notification.create({
      userId: reviewerId,
      message: `You have been assigned to review the manuscript "${manuscript.title}" by ${authorName}.`,
    })
  );

  await Promise.all(reviewerNotifications);

  // Create notifications for all admins and editors
  const adminsAndEditors = await User.find({ 
    role: { $in: [UserRole.ADMIN, UserRole.EDITOR] } 
  }).select('_id');
  
  const adminEditorNotifications = adminsAndEditors.map(user => 
    Notification.create({
      userId: user._id,
      message: `${editorName} assigned reviewers to manuscript "${manuscript.title}" by ${authorName}.`,
    })
  );

  await Promise.all(adminEditorNotifications);

  res.status(200).json({
    success: true,
    message: 'Reviewers assigned successfully',
    data: {
      manuscript: updatedManuscript,
    },
  });
});

/**
 * @desc    Update manuscript status
 * @route   PUT /api/manuscripts/:id/status
 * @access  Private (Editor only)
 */
export const updateManuscriptStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !Object.values(ManuscriptStatus).includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid status',
    });
    return;
  }

  const manuscript = await Manuscript.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!manuscript) {
    res.status(404).json({
      success: false,
      message: 'Manuscript not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Manuscript status updated successfully',
    data: {
      manuscript,
    },
  });
});

/**
 * @desc    Get manuscripts assigned to reviewer
 * @route   GET /api/manuscripts/assigned-to-me
 * @access  Private (Reviewer only)
 */
export const getAssignedManuscripts = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  const manuscripts = await Manuscript.find({ assignedReviewers: userId })
    .populate('submittedBy', 'fullname email university')
    .populate('assignedReviewers', 'fullname email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Assigned manuscripts retrieved successfully',
    data: {
      count: manuscripts.length,
      manuscripts,
    },
  });
});

/**
 * @desc    Submit review for a manuscript
 * @route   POST /api/manuscripts/:id/submit-review
 * @access  Private (Reviewer only)
 */
export const submitReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { recommendation, comments, strengths, weaknesses, suggestions } = req.body;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  // Find the manuscript
  const manuscript = await Manuscript.findById(id);

  if (!manuscript) {
    res.status(404).json({
      success: false,
      message: 'Manuscript not found',
    });
    return;
  }

  // Check if the reviewer is assigned to this manuscript
  const isAssigned = manuscript.assignedReviewers.some(
    (reviewerId) => reviewerId.toString() === userId
  );

  if (!isAssigned) {
    res.status(403).json({
      success: false,
      message: 'You are not assigned to review this manuscript',
    });
    return;
  }

  // Check if reviewer has already submitted a review
  const existingReview = await Review.findOne({
    manuscriptId: id,
    reviewerId: userId,
  });

  if (existingReview) {
    res.status(400).json({
      success: false,
      message: 'You have already submitted a review for this manuscript',
    });
    return;
  }

  // Create the review
  const review = await Review.create({
    manuscriptId: id,
    reviewerId: userId,
    recommendation,
    comments,
    strengths: strengths || '',
    weaknesses: weaknesses || '',
    suggestions: suggestions || '',
  });

  // Get reviewer's name
  const reviewer = await User.findById(userId).select('fullname');
  const reviewerName = reviewer?.fullname || 'A reviewer';

  // Get author and manuscript details
  const author = await User.findById(manuscript.submittedBy).select('fullname');
  const authorName = author?.fullname || 'Unknown author';

  // Create notification for the author
  await Notification.create({
    userId: manuscript.submittedBy,
    message: `A review has been submitted for your manuscript "${manuscript.title}".`,
  });

  // Create notifications for all admins and editors
  const adminsAndEditors = await User.find({ 
    role: { $in: [UserRole.ADMIN, UserRole.EDITOR] } 
  }).select('_id');
  
  const adminEditorNotifications = adminsAndEditors.map(user => 
    Notification.create({
      userId: user._id,
      message: `${reviewerName} submitted a review for manuscript "${manuscript.title}" by ${authorName}.`,
    })
  );

  await Promise.all(adminEditorNotifications);

  // Check if all assigned reviewers have submitted their reviews
  const totalReviews = await Review.countDocuments({ manuscriptId: id });
  const totalAssignedReviewers = manuscript.assignedReviewers.length;

  // If all reviewers have submitted, update manuscript status to DECISION_READY
  // Otherwise, keep it as UNDER_REVIEW
  if (totalReviews >= totalAssignedReviewers) {
    manuscript.status = ManuscriptStatus.DECISION_READY;
    await manuscript.save();
  } else if (manuscript.status === ManuscriptStatus.SUBMITTED) {
    // If this is the first review, change status from SUBMITTED to UNDER_REVIEW
    manuscript.status = ManuscriptStatus.UNDER_REVIEW;
    await manuscript.save();
  }

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: {
      review,
      manuscriptStatus: manuscript.status,
    },
  });
});

/**
 * @desc    Make final decision on manuscript (Editor)
 * @route   PUT /api/manuscripts/:id/decision
 * @access  Private (Editor/Admin only)
 */
export const makeDecision = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { decision, editorComments } = req.body;

  // Validate decision
  if (!decision || !['ACCEPTED', 'REJECTED'].includes(decision)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid decision (ACCEPTED or REJECTED)',
    });
    return;
  }

  // Find the manuscript
  const manuscript = await Manuscript.findById(id)
    .populate('submittedBy', 'fullname email')
    .populate('assignedReviewers', 'fullname email');

  if (!manuscript) {
    res.status(404).json({
      success: false,
      message: 'Manuscript not found',
    });
    return;
  }

  // Check if manuscript is ready for decision
  if (manuscript.status !== ManuscriptStatus.DECISION_READY) {
    res.status(400).json({
      success: false,
      message: 'Manuscript must be in DECISION_READY status before making a decision',
    });
    return;
  }

  // Update manuscript status
  manuscript.status = decision === 'ACCEPTED' ? ManuscriptStatus.ACCEPTED : ManuscriptStatus.REJECTED;
  await manuscript.save();

  // Get editor's name
  const editor = await User.findById(req.user?.id).select('fullname');
  const editorName = editor?.fullname || 'An editor';

  // Get author details
  const author = await User.findById(manuscript.submittedBy).select('fullname');
  const authorName = author?.fullname || 'Unknown author';

  const decisionText = decision === 'ACCEPTED' ? 'accepted' : 'rejected';

  // Create notification for the author
  await Notification.create({
    userId: manuscript.submittedBy,
    message: `Your manuscript "${manuscript.title}" has been ${decisionText}.`,
  });

  // Create notifications for all admins
  const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
  
  const adminNotifications = admins.map(admin => 
    Notification.create({
      userId: admin._id,
      message: `${editorName} ${decisionText} the manuscript "${manuscript.title}" by ${authorName}.`,
    })
  );

  await Promise.all(adminNotifications);

  // TODO: Send email notification to author about the decision
  // TODO: Store editor comments in a separate collection if needed

  res.status(200).json({
    success: true,
    message: `Manuscript ${decision === 'ACCEPTED' ? 'accepted' : 'rejected'} successfully`,
    data: {
      manuscript: {
        _id: manuscript._id,
        title: manuscript.title,
        status: manuscript.status,
        submittedBy: manuscript.submittedBy,
      },
    },
  });
});

/**
 * @desc    Get all reviews for a manuscript
 * @route   GET /api/manuscripts/:id/reviews
 * @access  Private - Editor/Admin
 */
export const getManuscriptReviews = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Find the manuscript
  const manuscript = await Manuscript.findById(id);

  if (!manuscript) {
    res.status(404).json({
      success: false,
      message: 'Manuscript not found',
    });
    return;
  }

  // Get all reviews for this manuscript with reviewer details
  const reviews = await Review.find({ manuscriptId: id })
    .populate('reviewerId', 'fullname email university')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Reviews fetched successfully',
    data: {
      reviews,
      totalReviews: reviews.length,
      assignedReviewers: manuscript.assignedReviewers.length,
    },
  });
});

/**
 * @desc    Get reviewer statistics
 * @route   GET /api/manuscripts/reviewer-stats
 * @access  Private (Reviewer only)
 */
export const getReviewerStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const reviewerId = req.user?.id;

  if (!reviewerId) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  // Get manuscripts assigned to this reviewer
  const assignedManuscripts = await Manuscript.find({
    assignedReviewers: reviewerId,
  });

  // Get completed reviews by this reviewer
  const completedReviews = await Review.countDocuments({
    reviewerId,
  });

  res.status(200).json({
    success: true,
    message: 'Reviewer statistics retrieved successfully',
    data: {
      totalAssigned: assignedManuscripts.length,
      completedReviews,
      pendingReviews: assignedManuscripts.length - completedReviews,
    },
  });
});

/**
 * @desc    Get author statistics
 * @route   GET /api/manuscripts/author-stats
 * @access  Private (Author only)
 */
export const getAuthorStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authorId = req.user?.id;

  if (!authorId) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  // Get all manuscripts by this author
  const manuscripts = await Manuscript.find({ submittedBy: authorId });

  const totalSubmissions = manuscripts.length;
  const acceptedWorks = manuscripts.filter(m => m.status === ManuscriptStatus.ACCEPTED).length;
  const rejectedWorks = manuscripts.filter(m => m.status === ManuscriptStatus.REJECTED).length;
  const underReview = manuscripts.filter(m => m.status === ManuscriptStatus.UNDER_REVIEW).length;
  const pending = manuscripts.filter(m => m.status === ManuscriptStatus.SUBMITTED || m.status === ManuscriptStatus.DECISION_READY).length;

  res.status(200).json({
    success: true,
    message: 'Author statistics retrieved successfully',
    data: {
      totalSubmissions,
      acceptedWorks,
      rejectedWorks,
      underReview,
      pending,
    },
  });
});
