import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface IStreak extends Document {
  userId: mongoose.Types.ObjectId
  currentStreak: number
  longestStreak: number
  lastPlanDate: string | null
}

const StreakSchema = new Schema<IStreak>({
  userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastPlanDate:  { type: String, default: null },
})

export const Streak = models.Streak || model<IStreak>('Streak', StreakSchema)