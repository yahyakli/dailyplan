import mongoose, { Schema, Document, model, models } from 'mongoose'

export interface ITimeSlot extends Document {
  userId: mongoose.Types.ObjectId
  date: string
  startTime: string
  endTime: string
  planId: mongoose.Types.ObjectId
  blockTitle: string
  blockCategory: string
  blockIndex: number
  createdAt: Date
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  }, // YYYY-MM-DD
  startTime: {
    type: String,
    required: true
  }, // HH:MM
  endTime: {
    type: String,
    required: true
  }, // HH:MM
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  blockTitle: {
    type: String,
    required: true
  },
  blockCategory: {
    type: String,
    enum: ['deep-work', 'communication', 'admin', 'personal', 'break'],
    required: true
  },
  blockIndex: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
})

// Compound indexes for efficient queries
// Get all slots for a user on a specific date
TimeSlotSchema.index({ userId: 1, date: 1 })
// Check for overlapping time ranges
TimeSlotSchema.index({ userId: 1, date: 1, startTime: 1, endTime: 1 })
// Find slots by plan
TimeSlotSchema.index({ planId: 1 })

export const TimeSlot = models.TimeSlot || model<ITimeSlot>('TimeSlot', TimeSlotSchema)
