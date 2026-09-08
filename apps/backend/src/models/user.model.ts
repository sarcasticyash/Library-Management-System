/**
 * Cloud-Native Library Management System (LMS)
 * User Persistence Model & Schema
 *
 * Governed by Phase 3 Section 7.1 (Collection: users) and Section 13 (Indexes).
 */

import { Schema, model, Document, Model } from 'mongoose';
import { UserRole, UserStatus } from '../types/user.types';
import { MAX_ACTIVE_LOANS_PER_PATRON } from '../types/constants';

export interface UserDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  activeBorrowCount: number;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<UserDocument>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [1, 'First name cannot be empty'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [1, 'Last name cannot be empty'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [255, 'Email cannot exceed 255 characters'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: [UserRole.PATRON, UserRole.ADMIN],
        message: 'Invalid user role: {VALUE}',
      },
      default: UserRole.PATRON,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
        message: 'Invalid user status: {VALUE}',
      },
      default: UserStatus.ACTIVE,
      required: true,
    },
    activeBorrowCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Active borrow count cannot be negative'],
      max: [
        MAX_ACTIVE_LOANS_PER_PATRON,
        `Active borrow count cannot exceed maximum quota of ${MAX_ACTIVE_LOANS_PER_PATRON}`,
      ],
      validate: {
        validator: Number.isInteger,
        message: 'Active borrow count must be an integer',
      },
    },
    phoneNumber: {
      type: String,
      default: null,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes per Phase 3 Section 13
UserSchema.index({ role: 1, status: 1 }, { name: 'idx_users_role_status' });

export const UserModel: Model<UserDocument> = model<UserDocument>('User', UserSchema);
