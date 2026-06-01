import { Schema, Document, model, models } from 'mongoose'

export interface IAICache extends Document {
  promptHash: string
  response: unknown
  createdAt: Date
}

const AICacheSchema = new Schema<IAICache>({
  promptHash: { type: String, required: true, index: true },
  response: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 minutes TTL
})

export const AICache = models.AICache || model<IAICache>('AICache', AICacheSchema)
