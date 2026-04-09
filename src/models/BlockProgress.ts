import mongoose, { Schema, Document, model, models } from 'mongoose'

export type BlockStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface IBlockProgress extends Document {
  userId: mongoose.Types.ObjectId
  planId: mongoose.Types.ObjectId
  blockIndex: number
  status: BlockStatus
  completionPercentage: number // 0-100
  startedAt?: Date
  completedAt?: Date
  actualDuration?: number // Minutes taken (vs planned)
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const BlockProgressSchema = new Schema<IBlockProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
      index: true,
    },
    blockIndex: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending',
      required: true,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    actualDuration: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
)

// Compound indexes for efficient queries
BlockProgressSchema.index({ userId: 1, planId: 1 }) // Get all progress for a user's plan
BlockProgressSchema.index({ userId: 1, status: 1 }) // Get all blocks by status for a user
BlockProgressSchema.index({ planId: 1, blockIndex: 1 }, { unique: true }) // One progress entry per block

// Update plan completion stats when a block is completed
BlockProgressSchema.post('save', async function (doc) {
  if (doc.status === 'completed' && doc.completedAt) {
    // Could trigger plan-level stats update here
    // For now, we'll handle this in the API layer
  }
})

export const BlockProgress =
  models.BlockProgress || model<IBlockProgress>('BlockProgress', BlockProgressSchema)

// Helper functions for common operations

/**
 * Get or create progress entry for a block
 */
export async function getOrCreateBlockProgress(
  userId: string,
  planId: string,
  blockIndex: number
): Promise<IBlockProgress> {
  await mongoose.connect(process.env.MONGODB_URI!)

  let progress = await BlockProgress.findOne({ userId, planId, blockIndex })

  if (!progress) {
    progress = await BlockProgress.create({
      userId,
      planId,
      blockIndex,
      status: 'pending',
      completionPercentage: 0,
    })
  }

  return progress
}

/**
 * Update block progress
 */
export async function updateBlockProgress(
  userId: string,
  planId: string,
  blockIndex: number,
  updates: Partial<Pick<IBlockProgress, 'status' | 'completionPercentage' | 'notes' | 'actualDuration'>>
): Promise<IBlockProgress> {
  await mongoose.connect(process.env.MONGODB_URI!)

  const progress = await BlockProgress.findOneAndUpdate(
    { userId, planId, blockIndex },
    {
      ...updates,
      ...(updates.status === 'in_progress' && { startedAt: new Date() }),
      ...(updates.status === 'completed' && { completedAt: new Date() }),
    },
    { upsert: true, new: true }
  )

  if (!progress) {
    throw new Error('Failed to update block progress')
  }

  return progress
}

/**
 * Get all progress entries for a plan
 */
export async function getPlanProgress(
  userId: string,
  planId: string
): Promise<IBlockProgress[]> {
  await mongoose.connect(process.env.MONGODB_URI!)

  return BlockProgress.find({ userId, planId })
    .sort({ blockIndex: 1 })
    .lean()
}

/**
 * Calculate plan completion stats
 */
export async function calculatePlanCompletion(
  userId: string,
  planId: string,
  totalBlocks: number
): Promise<{
  totalBlocks: number
  completedBlocks: number
  inProgressBlocks: number
  completionPercentage: number
  actualDuration: number
  estimatedDuration: number
}> {
  await mongoose.connect(process.env.MONGODB_URI!)

  const progressEntries = await BlockProgress.find({ userId, planId }).lean()

  const completedBlocks = progressEntries.filter((p) => p.status === 'completed').length
  const inProgressBlocks = progressEntries.filter((p) => p.status === 'in_progress').length
  const actualDuration = progressEntries.reduce(
    (sum, p) => sum + (p.actualDuration || 0),
    0
  )

  return {
    totalBlocks,
    completedBlocks,
    inProgressBlocks,
    completionPercentage: totalBlocks
      ? Math.round((completedBlocks / totalBlocks) * 100)
      : 0,
    actualDuration,
    estimatedDuration: progressEntries.reduce((sum, p) => {
      // This would need planned duration from the Plan document
      // For now, returning 0 as placeholder
      return sum
    }, 0),
  }
}

/**
 * Check if a block can be undone (within 5 minutes of completion)
 */
export async function canUndoBlockCompletion(
  userId: string,
  planId: string,
  blockIndex: number,
  undoWindowMinutes: number = 5
): Promise<{ canUndo: boolean; completedAt?: Date }> {
  await mongoose.connect(process.env.MONGODB_URI!)

  const progress = await BlockProgress.findOne({ userId, planId, blockIndex })

  if (!progress || progress.status !== 'completed' || !progress.completedAt) {
    return { canUndo: false }
  }

  const completedAt = new Date(progress.completedAt)
  const now = new Date()
  const diffMinutes = (now.getTime() - completedAt.getTime()) / (1000 * 60)

  return {
    canUndo: diffMinutes <= undoWindowMinutes,
    completedAt,
  }
}

/**
 * Undo block completion
 */
export async function undoBlockCompletion(
  userId: string,
  planId: string,
  blockIndex: number
): Promise<IBlockProgress> {
  const { canUndo } = await canUndoBlockCompletion(userId, planId, blockIndex)

  if (!canUndo) {
    throw new Error('Undo window has expired (5 minutes)')
  }

  await mongoose.connect(process.env.MONGODB_URI!)

  const progress = await BlockProgress.findOneAndUpdate(
    { userId, planId, blockIndex },
    {
      status: 'in_progress',
      completionPercentage: 50, // Reset to partial completion
      completedAt: undefined,
    },
    { new: true }
  )

  if (!progress) {
    throw new Error('Block progress not found')
  }

  return progress
}
