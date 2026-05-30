import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface ITask {
  _id?: mongoose.Types.ObjectId
  title: string
  description?: string
  startTime: string
  endTime: string
  durationMin: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  status: 'todo' | 'in_progress' | 'done' | 'skipped'
  xpValue: number
  order: number
}

export interface IPlan extends Document {
  userId?: mongoose.Types.ObjectId | null
  guestSessionId?: string
  title: string
  braindump: string
  planDate: Date
  startTime: string
  endTime: string
  contextTags: string[]
  tasks: ITask[]
  status: 'draft' | 'active' | 'completed' | 'missed'
  aiModel?: string
  aiPromptHash?: string
  totalXPEarned: number
  completionRate: number
  isGuestPlan: boolean
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  durationMin: { type: Number, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  category: { type: String },
  status: { type: String, enum: ['todo', 'in_progress', 'done', 'skipped'], default: 'todo' },
  xpValue: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
})

const PlanSchema = new Schema<IPlan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  guestSessionId: { type: String, index: true },
  title: { type: String, required: true, maxlength: 80 },
  braindump: { type: String, required: true },
  planDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // HH:MM
  endTime: { type: String, required: true }, // HH:MM
  contextTags: [{ type: String }],
  tasks: [TaskSchema],
  status: { type: String, enum: ['draft', 'active', 'completed', 'missed'], default: 'draft' },
  aiModel: { type: String },
  aiPromptHash: { type: String },
  totalXPEarned: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  isGuestPlan: { type: Boolean, default: false },
}, { timestamps: true })

// Index for efficient plan retrieval
PlanSchema.index({ userId: 1, planDate: 1, status: 1 })
PlanSchema.index({ guestSessionId: 1, planDate: 1 })

export const Plan = models.Plan || model<IPlan>('Plan', PlanSchema)