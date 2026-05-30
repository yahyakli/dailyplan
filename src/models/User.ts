import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface IBadgeRef {
  badgeId: string
  earnedAt: Date
}

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  image?: string // Still keep for NextAuth compatibility
  avatar?: string // Blueprint name
  googleId?: string
  provider: 'credentials' | 'google'
  locale: 'en' | 'fr' | 'ar'
  theme: 'light' | 'dark' | 'system'
  points: number
  streakCurrent: number
  streakMax: number
  lastActiveDate?: Date
  badges: IBadgeRef[]
  role: 'user' | 'admin'
  isDeleted: boolean
  resetToken?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String }, // hashed, only for credentials users
  image: { type: String },
  avatar: { type: String },
  googleId: { type: String },
  provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
  locale: { type: String, enum: ['en', 'fr', 'ar'], default: 'en' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  points: { type: Number, default: 0 },
  streakCurrent: { type: Number, default: 0 },
  streakMax: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  badges: [{
    badgeId: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now }
  }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isDeleted: { type: Boolean, default: false },
  resetToken: { type: String }, // For password reset
}, { timestamps: true })

export const User = models.User || model<IUser>('User', UserSchema)