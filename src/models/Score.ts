import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface IScore extends Document {
  userId: mongoose.Types.ObjectId
  totalPoints: number
  weeklyPoints: number
  allTimePlans: number
  perfectDaysInARow: number
  lastUpdated: Date
}

const ScoreSchema = new Schema<IScore>({
  userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalPoints:       { type: Number, default: 0 },
  weeklyPoints:      { type: Number, default: 0 },
  allTimePlans:      { type: Number, default: 0 },
  perfectDaysInARow: { type: Number, default: 0 },
  lastUpdated:       { type: Date, default: Date.now },
})

export const Score = models.Score || model<IScore>('Score', ScoreSchema)