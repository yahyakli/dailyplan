import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface IBadge extends Document {
  _id: string // Slug: 'early_bird', 'perfect_week', etc.
  name: {
    en: string
    fr: string
    ar: string
  }
  description: {
    en: string
    fr: string
    ar: string
  }
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  category: 'streak' | 'completion' | 'planning' | 'social' | 'special'
  condition: Record<string, any>
  xpReward: number
  isSecret: boolean
  totalEarned: number
  createdAt: Date
  updatedAt: Date
}

const BadgeSchema = new Schema<IBadge>({
  _id: { type: String, required: true },
  name: {
    en: { type: String, required: true },
    fr: { type: String, required: true },
    ar: { type: String, required: true },
  },
  description: {
    en: { type: String, required: true },
    fr: { type: String, required: true },
    ar: { type: String, required: true },
  },
  icon: { type: String, required: true },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  category: { type: String, enum: ['streak', 'completion', 'planning', 'social', 'special'], default: 'planning' },
  condition: { type: Object, required: true },
  xpReward: { type: Number, default: 0 },
  isSecret: { type: Boolean, default: false },
  totalEarned: { type: Number, default: 0 },
}, { timestamps: true })

export const Badge = models.Badge || model<IBadge>('Badge', BadgeSchema)