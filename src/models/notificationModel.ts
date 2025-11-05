import mongoose, { Document, Schema } from 'mongoose';

// Notification interface
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true, // Index for faster queries
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for efficient querying of user's notifications
notificationSchema.index({ userId: 1, createdAt: -1 });

// Create and export the model
const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
