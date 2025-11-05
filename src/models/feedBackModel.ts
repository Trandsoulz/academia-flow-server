import mongoose, { Schema, Document } from 'mongoose';

// Define feedback categories
export enum FeedbackCategory {
  ACADEMIC = 'Academic',
  FACILITY = 'Facility',
  WELFARE = 'Welfare',
  TECHNOLOGY = 'Technology',
  ADMINISTRATION = 'Administration',
  OTHER = 'Other',
}

// Define feedback status
export enum FeedbackStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
}

// Define the Feedback interface
export interface IFeedback extends Document {
  title: string;
  category: FeedbackCategory;
  description: string;
  status: FeedbackStatus;
  studentId: mongoose.Types.ObjectId;
  adminResponse?: string;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Feedback schema
const feedbackSchema = new Schema<IFeedback>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: Object.values(FeedbackCategory),
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(FeedbackStatus),
      default: FeedbackStatus.PENDING,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [2000, 'Admin response cannot exceed 2000 characters'],
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
feedbackSchema.index({ studentId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1 });

// Create and export the Feedback model
const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);

export default Feedback;