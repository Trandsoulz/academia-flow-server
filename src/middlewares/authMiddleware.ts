import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/userModel';
import catchAsync from '../utils/catchAsync';

/**
 * Protect routes - verify JWT token
 */
export const protect = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Not authorized. Please login.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Verify token
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
  const decoded = jwt.verify(token, secret) as { id: string };

  // Get user from token
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(403).json({
      success: false,
      message: 'Your account has been deactivated',
    });
    return;
  }

  // Attach user to request
  req.user = {
    id: (user._id as any).toString(),
    role: user.role,
  };

  next();
});

/**
 * Authorize specific roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this route`,
      });
      return;
    }

    next();
  };
};
