import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface IAILog extends Document {
  userId?: mongoose.Types.ObjectId
  guestSessionId?: string
  ip?: string
  model: string
  tokens: number
  createdAt: Date
}

const AILogSchema = new Schema<IAILog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  guestSessionId: { type: String, index: true },
  ip: { type: String, index: true },
  model: { type: String },
  tokens: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours TTL
})

export const AILog = models.AILog || model<IAILog>('AILog', AILogSchema)
