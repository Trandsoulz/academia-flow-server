import mongoose, { Document, Schema } from 'mongoose';

// Review recommendation enum
export enum ReviewRecommendation {
  ACCEPT = 'ACCEPT',
  MINOR_REVISION = 'MINOR_REVISION',
  MAJOR_REVISION = 'MAJOR_REVISION',
  REJECT = 'REJECT',
}

// Review interface
export interface IReview extends Document {
  manuscriptId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  recommendation: ReviewRecommendation;
  comments: string;
  strengths?: string;
  weaknesses?: string;
  suggestions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Review schema
const reviewSchema = new Schema<IReview>(
  {
    manuscriptId: {
      type: Schema.Types.ObjectId,
      ref: 'Manuscript',
      required: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recommendation: {
      type: String,
      enum: Object.values(ReviewRecommendation),
      required: true,
    },
    comments: {
      type: String,
      required: true,
    },
    strengths: {
      type: String,
      default: '',
    },
    weaknesses: {
      type: String,
      default: '',
    },
    suggestions: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient queries
reviewSchema.index({ manuscriptId: 1, reviewerId: 1 });

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
