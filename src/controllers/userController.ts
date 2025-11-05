import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { UserRole } from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import { authLog } from '../configs/loggerConfig';

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d' as any;

  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign({ id: userId }, secret, options);
};

/**
 * @desc    Register new user (Signup)
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { fullname, email, password, role, university, department, phone } = req.body;

  // Validate required fields
  if (!fullname || !email || !password) {
    res.status(400).json({
      success: false,
      message: 'Please provide fullname, email, and password',
    });
    return;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409).json({
      success: false,
      message: 'User with this email already exists',
    });
    return;
  }

  // Validate role if provided
  if (role && !Object.values(UserRole).includes(role)) {
    res.status(400).json({
      success: false,
      message: 'Invalid role. Must be either admin, author, reviewer, or editor',
    });
    return;
  }

  // Create new user
  const user = await User.create({
    fullname,
    email,
    password,
    role: role || UserRole.AUTHOR,
    university,
    department,
    phone,
  });

  // Generate token
  const token = generateToken((user._id as any).toString());

  authLog.info(`New user registered: ${user.email} (ID: ${(user._id as any).toString()})`);
  // Return user data (without password)
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        university: user.university,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

/**
 * @desc    Login user (Signin)
 * @route   POST /api/auth/signin
 * @access  Public
 */
export const signin = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
    return;
  }

  // Find user by email and include password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  // Check if account is shadow deleted (deactivated)
  if (user.shadowDelete) {
    res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact admin@uniport.edu.ng to rectify this issue.',
      isDeactivated: true,
    });
    return;
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.',
    });
    return;
  }

  // Verify password
  const isPasswordMatch = await user.comparePassword(password);
  
  if (!isPasswordMatch) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  // Generate token
  const token = generateToken((user._id as any).toString());

  authLog.info(`User logged in: ${user.email} (ID: ${(user._id as any).toString()})`);
  // Return user data (without password)
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        university: user.university,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = catchAsync(async (req: Request, res: Response): Promise<void> => {
  // User is attached to req by auth middleware
  const user = await User.findById(req.user?.id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  authLog.info(`User retrieved: ${user.email} (ID: ${(user._id as any).toString()})`);
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        university: user.university,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

/**
 * @desc    Update user profile
 * @route   PATCH /api/auth/update-profile
 * @access  Private
 */
export const updateProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { fullname, university, department, phone } = req.body;

  // User is attached to req by auth middleware
  const user = await User.findById(req.user?.id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  // Update only provided fields
  if (fullname !== undefined) user.fullname = fullname;
  if (university !== undefined) user.university = university;
  if (department !== undefined) user.department = department;
  if (phone !== undefined) user.phone = phone;

  await user.save();

  authLog.info(`User profile updated: ${user.email} (ID: ${(user._id as any).toString()})`);
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        university: user.university,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

/**
 * @desc    Get all reviewers
 * @route   GET /api/users/reviewers
 * @access  Private (Editor/Admin only)
 */
export const getReviewers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const reviewers = await User.find({ role: UserRole.REVIEWER, isActive: true })
    .select('fullname email university department')
    .sort({ fullname: 1 });

  authLog.info(`Retrieved ${reviewers.length} reviewers`);
  
  res.status(200).json({
    success: true,
    message: 'Reviewers retrieved successfully',
    data: {
      count: reviewers.length,
      reviewers,
    },
  });
});

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (Admin only)
 */
export const getUserStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  authLog.info(`Retrieved user statistics: ${totalUsers} total users`);
  
  res.status(200).json({
    success: true,
    message: 'User statistics retrieved successfully',
    data: {
      totalUsers,
      activeUsers,
      usersByRole,
    },
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
export const getAllUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 });

  authLog.info(`Retrieved ${users.length} users`);
  
  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      count: users.length,
      users,
    },
  });
});

/**
 * @desc    Deactivate user (shadow delete)
 * @route   PUT /api/users/:id/deactivate
 * @access  Private (Admin only)
 */
export const deactivateUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  // Update shadowDelete status
  user.shadowDelete = true;
  user.isActive = false;
  await user.save();

  authLog.info(`User ${user.email} has been deactivated by admin`);

  res.status(200).json({
    success: true,
    message: 'User has been deactivated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        shadowDelete: user.shadowDelete,
        isActive: user.isActive,
      },
    },
  });
});

/**
 * @desc    Activate user (restore from shadow delete)
 * @route   PUT /api/users/:id/activate
 * @access  Private (Admin only)
 */
export const activateUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  // Restore user access
  user.shadowDelete = false;
  user.isActive = true;
  await user.save();

  authLog.info(`User ${user.email} has been activated by admin`);

  res.status(200).json({
    success: true,
    message: 'User has been activated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        shadowDelete: user.shadowDelete,
        isActive: user.isActive,
      },
    },
  });
});
