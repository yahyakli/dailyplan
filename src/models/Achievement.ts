import mongoose, { Schema, Document, model, models } from 'mongoose'
import type { BadgeId } from '@/lib/types'

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId
  badges: { id: BadgeId; unlockedAt: Date }[]
}

const AchievementSchema = new Schema<IAchievement>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  badges: [{
    id:         { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
    _id: false,
  }],
})

export const Achievement = models.Achievement || model<IAchievement>('Achievement', AchievementSchema)