import mongoose, { Document, Schema } from 'mongoose';

// Manuscript status enum
export enum ManuscriptStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DECISION_READY = 'DECISION_READY',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// Manuscript interface
export interface IManuscript extends Document {
  title: string;
  abstract: string;
  keywords: string;
  authors: string;
  submittedBy: mongoose.Types.ObjectId;
  assignedReviewers: mongoose.Types.ObjectId[]; // Array of reviewer user IDs
  status: ManuscriptStatus;
  fileName: string;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Manuscript schema
const manuscriptSchema = new Schema<IManuscript>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
      trim: true,
    },
    keywords: {
      type: String,
      required: [true, 'Keywords are required'],
      trim: true,
    },
    authors: {
      type: String,
      required: [true, 'Authors are required'],
      trim: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitted by user is required'],
    },
    assignedReviewers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: Object.values(ManuscriptStatus),
      default: ManuscriptStatus.SUBMITTED,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Export the model
const Manuscript = mongoose.model<IManuscript>('Manuscript', manuscriptSchema);

export default Manuscript;
