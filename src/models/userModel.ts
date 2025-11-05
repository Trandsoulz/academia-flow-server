import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User role enum
export enum UserRole {
  ADMIN = 'admin',
  AUTHOR = 'author',
  REVIEWER = 'reviewer',
  EDITOR = 'editor',
}

// User interface
export interface IUser extends Document {
  fullname: string;
  email: string;
  password: string;
  role: UserRole;
  university?: string;
  department?: string;
  phone?: string;
  isActive: boolean;
  shadowDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<IUser>(
  {
    fullname: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: 'Role must be either admin, author, reviewer, or editor',
      },
      default: UserRole.AUTHOR,
    },
    university: {
      type: String,
      trim: true,
      maxlength: [200, 'University name cannot exceed 200 characters'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
        'Please provide a valid phone number',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    shadowDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Create and export the model
const User = mongoose.model<IUser>('User', userSchema);

export default User;
