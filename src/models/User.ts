import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  image?: string
  provider: 'credentials' | 'google'
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String }, // hashed, only for credentials users
  image:     { type: String },
  provider:  { type: String, enum: ['credentials', 'google'], default: 'credentials' },
  createdAt: { type: Date, default: Date.now },
})

export const User = models.User || model<IUser>('User', UserSchema)