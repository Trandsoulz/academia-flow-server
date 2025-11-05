# AcademiaFlow - Backend API Server

A robust Node.js backend API for the AcademiaFlow Academic Manuscript Management System, built with TypeScript, Express, and MongoDB. This server handles manuscript submissions, peer reviews, user management, and real-time notifications.

## 🎯 Overview

The AcademiaFlow backend provides a RESTful API for managing the complete academic manuscript review workflow. It features role-based access control, file uploads, JWT authentication, and comprehensive notification system.

## ✨ Features

- ✅ **TypeScript** - Full type safety across the codebase
- ✅ **Express.js** - Fast and minimal web framework
- ✅ **MongoDB with Mongoose** - Flexible NoSQL database with ODM
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - Fine-grained permissions (Author, Reviewer, Editor, Admin)
- ✅ **File Upload** - Multer integration for manuscript uploads
- ✅ **Notifications System** - Real-time activity notifications
- ✅ **Error Handling** - Centralized error handling with custom error classes
- ✅ **Logging** - Advanced logging with Winston and daily file rotation
- ✅ **Error Monitoring** - Sentry integration for production error tracking
- ✅ **CORS Support** - Cross-Origin Resource Sharing enabled
- ✅ **Rate Limiting** - IP-based request rate limiting
- ✅ **Hot Reload** - Development server with nodemon
- ✅ **Input Validation** - Request validation and sanitization
- ✅ **Soft Delete** - Shadow delete for user accounts

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn

### Environment Setup

1. **Copy environment template:**
```bash
cp .env.local .env
```

2. **Configure your environment variables in `.env`:**
```bash
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/academiaflow
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
SENTRY_DSN=your_sentry_dsn_here  # Optional for error monitoring
```

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/        # Request handlers and business logic
│   │   ├── userController.ts
│   │   ├── manuscriptController.ts
│   │   ├── notificationController.ts
│   │   └── feedBackController.ts
│   ├── models/            # Mongoose database models
│   │   ├── userModel.ts          # User schema with roles
│   │   ├── manuscriptModel.ts    # Manuscript submissions
│   │   ├── reviewModel.ts        # Peer reviews
│   │   ├── notificationModel.ts  # Notifications
│   │   └── feedBackModel.ts
│   ├── routes/            # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── manuscriptRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   └── feedBackRoutes.ts
│   ├── middlewares/       # Custom middleware
│   │   ├── authMiddleware.ts      # JWT verification & authorization
│   │   ├── errorHandler.ts        # Global error handling
│   │   ├── rateLimitMiddleware.ts # Rate limiting
│   │   └── catchAll404Errors.ts   # 404 handler
│   ├── configs/           # Configuration files
│   │   ├── dbConfig.ts           # MongoDB connection
│   │   ├── envConfig.ts          # Environment variables
│   │   ├── loggerConfig.ts       # Winston logging
│   │   ├── sentryConfig.ts       # Error monitoring
│   │   ├── rateLimitConfig.ts    # Rate limiting
│   │   └── multerConfig.ts       # File upload
│   ├── utils/             # Utility functions
│   │   ├── catchAsync.ts         # Async error wrapper
│   │   └── health.ts             # Health check utilities
│   ├── app.ts             # Express app configuration
│   └── server.ts          # Server entry point
├── logs/                  # Application logs (auto-generated)
├── uploads/               # Uploaded manuscript files
├── types/                 # TypeScript type definitions
├── .env                   # Environment variables (not in repo)
├── .env.local             # Environment template
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🔐 Authentication & Authorization

### User Roles

1. **Author** - Submit and track manuscripts
2. **Reviewer** - Review assigned manuscripts
3. **Editor** - Manage manuscripts and assign reviewers
4. **Admin** - Full platform access and user management

### Authentication Flow

1. User registers via `/api/auth/signup`
2. Server returns JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Protected routes verify token via `protect` middleware
5. Role-specific routes check permissions via `authorize` middleware

## 📝 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register New User
```http
POST /auth/signup
Content-Type: application/json

{
  "fullname": "Dr. Jane Smith",
  "email": "jane@university.edu",
  "password": "securepass123",
  "role": "author",
  "university": "MIT",
  "department": "Computer Science",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "jane@university.edu",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "fullname": "Dr. Jane Smith",
      "email": "jane@university.edu",
      "role": "author"
    }
  }
}
```

### Manuscript Endpoints

#### Submit Manuscript (Author)
```http
POST /manuscripts/submit
Authorization: Bearer <token>
Content-Type: multipart/form-data

title: "Machine Learning in Healthcare"
abstract: "This paper explores..."
keywords: "ML, Healthcare, AI"
authors: "Dr. Jane Smith, Dr. John Doe"
file: <manuscript.pdf>
```

#### Get My Manuscripts (Author)
```http
GET /manuscripts/my-manuscripts
Authorization: Bearer <token>
```

#### Get All Manuscripts (Editor/Admin)
```http
GET /manuscripts
Authorization: Bearer <token>
```

#### Assign Reviewers (Editor/Admin)
```http
PUT /manuscripts/:id/assign-reviewers
Authorization: Bearer <token>
Content-Type: application/json

{
  "reviewerIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

#### Submit Review (Reviewer)
```http
POST /manuscripts/:id/submit-review
Authorization: Bearer <token>
Content-Type: application/json

{
  "recommendation": "ACCEPT",
  "comments": "Excellent work...",
  "strengths": "Well-researched methodology",
  "weaknesses": "Minor formatting issues",
  "suggestions": "Consider adding..."
}
```

**Recommendation Options:**
- `ACCEPT` - Accept the manuscript
- `MINOR_REVISION` - Accept with minor revisions
- `MAJOR_REVISION` - Requires major revisions
- `REJECT` - Reject the manuscript

#### Make Decision (Editor/Admin)
```http
PUT /manuscripts/:id/decision
Authorization: Bearer <token>
Content-Type: application/json

{
  "decision": "ACCEPTED",
  "decisionNotes": "Congratulations! Your manuscript has been accepted."
}
```

#### Get Manuscript Reviews (Editor/Admin)
```http
GET /manuscripts/:id/reviews
Authorization: Bearer <token>
```

### Notification Endpoints

#### Get My Notifications
```http
GET /notifications
Authorization: Bearer <token>
Query Parameters:
  - limit: number (default: 10)
  - page: number (default: 1)
  - isRead: boolean (optional)
```

#### Mark Notification as Read
```http
PATCH /notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PATCH /notifications/read-all
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /notifications/:id
Authorization: Bearer <token>
```

#### Delete All Notifications
```http
DELETE /notifications/all
Authorization: Bearer <token>
```

### User Management Endpoints (Admin Only)

#### Get All Users
```http
GET /users
Authorization: Bearer <token>
```

#### Get User Statistics
```http
GET /users/stats
Authorization: Bearer <token>
```

#### Activate User
```http
PUT /users/:id/activate
Authorization: Bearer <token>
```

#### Deactivate User
```http
PUT /users/:id/deactivate
Authorization: Bearer <token>
```

### Health Check

#### Server & Database Health
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-05T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "environment": "development"
}
```

## 🗄️ Database Models

### User Model
```typescript
{
  fullname: string;
  email: string (unique, lowercase);
  password: string (hashed);
  role: 'admin' | 'author' | 'reviewer' | 'editor';
  university?: string;
  department?: string;
  phone?: string;
  isActive: boolean;
  shadowDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Manuscript Model
```typescript
{
  title: string;
  abstract: string;
  keywords: string;
  authors: string;
  submittedBy: ObjectId (ref: User);
  assignedReviewers: ObjectId[] (ref: User);
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'DECISION_READY' | 'ACCEPTED' | 'REJECTED';
  fileName: string;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Review Model
```typescript
{
  manuscriptId: ObjectId (ref: Manuscript);
  reviewerId: ObjectId (ref: User);
  recommendation: 'ACCEPT' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECT';
  comments: string;
  strengths?: string;
  weaknesses?: string;
  suggestions?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification Model
```typescript
{
  userId: ObjectId (ref: User);
  message: string (max 500 chars);
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔄 Manuscript Workflow & Notifications

### 1. Submission Phase
- Author submits manuscript
- Status: `SUBMITTED`
- **Notifications sent to:** Author, All Admins, All Editors

### 2. Review Assignment
- Editor assigns reviewers
- Status: `UNDER_REVIEW`
- **Notifications sent to:** Author, Assigned Reviewers, All Admins, All Editors

### 3. Review Submission
- Reviewers submit reviews
- Status remains: `UNDER_REVIEW`
- **Notifications sent to:** Author, All Admins, All Editors

### 4. Decision Phase
- Editor makes final decision
- Status: `ACCEPTED` or `REJECTED`
- **Notifications sent to:** Author, All Admins

## 🛡️ Security Features

- **Password Hashing** - Bcrypt with salt rounds
- **JWT Tokens** - Secure token-based authentication
- **Input Validation** - Request validation and sanitization
- **Rate Limiting** - Prevent brute force attacks
- **CORS** - Controlled cross-origin access
- **Environment Variables** - Sensitive data protection
- **Role-Based Access** - Fine-grained permissions
- **Soft Delete** - Shadow delete for account deactivation
- **HTTP-Only Tokens** - Secure token storage recommendations

## 📊 Logging & Monitoring

### Winston Logger
- **Console logs** - Development environment
- **File logs** - Production environment with daily rotation
- **Error logs** - Separate error log file
- **Log levels** - error, warn, info, http, debug

### Sentry Integration
- **Error tracking** - Production error monitoring
- **Performance monitoring** - Transaction tracking
- **User context** - Error reports with user information
- **Environment tags** - Distinguish dev/prod errors

## ⚙️ Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/academiaflow

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn_here

# CORS (Optional)
CLIENT_URL=http://localhost:5173
```

## 🧪 Testing Endpoints

### Rate Limit Test
```http
GET /test-rate-limit
```

### Sentry Error Test (Development Only)
```http
GET /debug-sentry
```

## 📦 Dependencies

### Core
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `multer` - File uploads
- `cors` - CORS middleware

### Development
- `typescript` - Type safety
- `nodemon` - Hot reload
- `ts-node` - TypeScript execution

### Utilities
- `winston` - Logging
- `@sentry/node` - Error monitoring
- `dotenv` - Environment variables
- `http-errors` - HTTP error creation

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment
- Set `NODE_ENV=production`
- Use production MongoDB URI
- Set strong `JWT_SECRET`
- Configure Sentry DSN
- Enable HTTPS
- Set proper CORS origins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript best practices
4. Write meaningful commit messages
5. Test your changes
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Express.js for the robust web framework
- Mongoose for elegant MongoDB modeling
- Winston for powerful logging
- Sentry for error monitoring

---

Built with ❤️ for the academic community
├── app.ts            # Express app setup
└── server.ts         # Server entry point
logs/                 # Log files (auto-generated)
├── combined-*.log    # Combined logs with rotation
└── error-*.log       # Error logs with rotation
```

## Key Patterns

### Error Handling

All controllers use `catchAsync` wrapper and `http-errors` for consistent error handling:

```typescript
export const getTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(createError(404, 'Task not found'));
    }

    res.status(200).json({
      status: 'success',
      data: task,
    });
  },
);
```

The global error handler provides comprehensive error handling with:
- MongoDB duplicate key error handling
- Mongoose validation error handling
- Different responses for development vs production
- Automatic error logging

### Database Models

Using Mongoose schemas with TypeScript interfaces (no classes):

```typescript
export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  completed: boolean;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String },
    description: { type: String, trim: true },
    completed: { type: Boolean },
  },
  { timestamps: true },
);
```

### Logging System

Advanced logging with Winston featuring:
- Multiple log levels (error, warn, info)
- Daily rotating files
- Colored console output for development
- Automatic log compression and retention
- Separate error and combined logs

```typescript
import { globalLog, dbLog, authLog } from './configs/loggerConfig';

globalLog.info('Server started successfully');
dbLog.error('Database connection failed');
```

### Error Monitoring

Sentry integration for production error tracking:
- Automatic error capture and reporting
- Environment-specific configuration
- Debug endpoint for testing error tracking

### Rate Limiting

Simple and effective rate limiting:
- **Basic Rate Limiter**: Applied globally to all routes
- **Production**: 100 requests per 15 minutes
- **Development**: 1000 requests per 15 minutes
- Automatic rate limit headers in response
- Clean error messages when limits are exceeded

```typescript
import { rateLimiter } from './configs/rateLimitConfig';

// Apply rate limiting to all routes
app.use(rateLimiter);
```

### Health Monitoring

Simple health check with readable uptime format:

```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": "2h 15m 30s",
  "database": "connected",
  "server": "online"
}
```

## Development

### Dependencies

**Core Dependencies:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable loading
- `http-errors` - HTTP error utilities
- `winston` & `winston-daily-rotate-file` - Advanced logging
- `@sentry/node` - Error monitoring and tracking
- `morgan` - HTTP request logging
- `cross-env` - Cross-platform environment variables
- `express-rate-limit` - Request rate limiting

**Development Dependencies:**
- `typescript` & `ts-node` - TypeScript support
- `nodemon` - Development hot reload
- `eslint` & `prettier` - Code quality and formatting
- `@types/*` - TypeScript type definitions

### Environment Variables

Required environment variables:

```bash
NODE_ENV=development          # Environment (development/production/prod)
PORT=3000                    # Server port
MONGO_URI=mongodb://...      # MongoDB connection string
SENTRY_DSN=https://...       # Sentry DSN (optional)
```

### Log Files

The application automatically creates and manages log files in the `logs/` directory:
- `combined-YYYY-MM-DD-HH.log` - All application logs
- `error-YYYY-MM-DD-HH.log` - Error logs only
- Automatic compression and 14-day retention
- Maximum file size of 20MB

Perfect for developing scalable REST APIs!
