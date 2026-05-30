import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface IXPLog extends Document {
  userId: mongoose.Types.ObjectId
  xp: number
  reason: string
  earnedAt: Date
}

const XPLogSchema = new Schema<IXPLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  xp: { type: Number, required: true },
  reason: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now, index: true },
})

// Compound index for monthly/weekly aggregation
XPLogSchema.index({ userId: 1, earnedAt: 1 })

export const XPLog = models.XPLog || model<IXPLog>('XPLog', XPLogSchema)