import mongoose, { Schema, Document, model, models } from 'mongoose'
import type { BlockCategory, Priority } from '@/lib/types'

export interface IBlock {
  startTime: string
  endTime: string
  title: string
  category: BlockCategory
  priority: Priority
  notes?: string
}

export interface IPlan extends Document {
  userId: mongoose.Types.ObjectId
  date: string
  blocks: IBlock[]
  overflow: string[]
  insight: string
  rawInput: string
  isArchived: boolean
  createdAt: Date
}

const BlockSchema = new Schema<IBlock>({
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  title:     { type: String, required: true },
  category:  { type: String, enum: ['deep-work','communication','admin','personal','break'], required: true },
  priority:  { type: String, enum: ['high','medium','low'], required: true },
  notes:     { type: String },
}, { _id: false })

const PlanSchema = new Schema<IPlan>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date:     { type: String, required: true }, // YYYY-MM-DD
  blocks:   [BlockSchema],
  overflow: [String],
  insight:  { type: String },
  rawInput: { type: String },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

// Index for efficient plan retrieval by user and date
PlanSchema.index({ userId: 1, date: 1, isArchived: 1 })

export const Plan = models.Plan || model<IPlan>('Plan', PlanSchema)