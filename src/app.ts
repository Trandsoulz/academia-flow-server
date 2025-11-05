import express, { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import path from 'path';

import taskRoutes from './routes/taskRoutes';
import authRoutes from './routes/authRoutes';
import feedBackRoutes from './routes/feedBackRoutes';
import manuscriptRoutes from './routes/manuscriptRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import catchAll404Errors from './middlewares/catchAll404Errors';
import globalErrorHandler from './middlewares/errorHandler';
import { healthCheck } from './utils/health';
import { connectToDatabase } from './configs/dbConfig';
import { rateLimiter } from './configs/rateLimitConfig';

import './configs/sentryConfig';

const app = express();

// connect to DB
connectToDatabase();

// Rate limiting - Apply to all requests
app.use(rateLimiter);

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send({
    status: 'success',
    message: 'Api is live',
  });
});

app.use('/health', healthCheck);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedBackRoutes);
app.use('/api/manuscripts', manuscriptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/debug-sentry', (req, res) => {
  throw new Error('My first Sentry error!');
});

// Test rate limiting endpoint
app.get('/test-rate-limit', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Rate limiting test endpoint',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    rateLimitInfo: {
      remaining: res.getHeader('X-RateLimit-Remaining'),
      limit: res.getHeader('X-RateLimit-Limit'),
      reset: res.getHeader('X-RateLimit-Reset'),
    },
  });
});

// Error handlers
Sentry.setupExpressErrorHandler(app); // sentry error handler middleware

app.use(catchAll404Errors); // Catch all 404 errors...

app.use(globalErrorHandler); // Catch all errors...

export default app;
