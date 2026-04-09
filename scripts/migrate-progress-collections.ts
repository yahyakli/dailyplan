/**
 * Database Migration Script
 *
 * This script ensures all indexes are properly created for the
 * TimeSlot and BlockProgress collections.
 *
 * Run with: npx ts-node scripts/migrate-progress-collections.ts
 */

import mongoose from 'mongoose'
import { TimeSlot } from '../src/models/TimeSlot'
import { BlockProgress } from '../src/models/BlockProgress'

async function migrate() {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    console.error('Error: MONGODB_URI environment variable is required')
    console.error('Set it before running:')
    console.error('  Windows PowerShell: $env:MONGODB_URI="your-uri"')
    console.error('  Windows CMD: set MONGODB_URI=your-uri')
    console.error('  Unix/Mac: export MONGODB_URI=your-uri')
    process.exit(1)
  }

  console.log('Connecting to MongoDB...')
  await mongoose.connect(mongoUri)
  console.log('Connected successfully!\n')

  try {
    // Create TimeSlot indexes
    console.log('Setting up TimeSlot collection indexes...')
    const timeSlotIndexes: Record<string, number>[] = [
      { userId: 1, date: 1 }, // Get all slots for a user on a specific date
      { userId: 1, date: 1, startTime: 1, endTime: 1 }, // Check for overlapping time ranges
      { planId: 1 }, // Find slots by plan
    ]

    for (const index of timeSlotIndexes) {
      try {
        await TimeSlot.collection.createIndex(index)
        console.log(`  ✓ Created index: ${JSON.stringify(index)}`)
      } catch (err: unknown) {
        const mongoErr = err as { code?: number; message?: string }
        if (mongoErr.code === 86) {
          console.log(`  ✓ Index already exists: ${JSON.stringify(index)}`)
        } else {
          console.error(`  ✗ Failed to create index: ${JSON.stringify(index)}`, mongoErr.message)
        }
      }
    }

    // Create BlockProgress indexes
    console.log('\nSetting up BlockProgress collection indexes...')
    const blockProgressIndexes: Record<string, number>[] = [
      { userId: 1, planId: 1 }, // Get all progress for a user's plan
      { userId: 1, status: 1 }, // Get all blocks by status for a user
      { planId: 1, blockIndex: 1 }, // One progress entry per block (unique handled by schema)
    ]

    for (const index of blockProgressIndexes) {
      try {
        await BlockProgress.collection.createIndex(index)
        console.log(`  ✓ Created index: ${JSON.stringify(index)}`)
      } catch (err: unknown) {
        const mongoErr = err as { code?: number; message?: string }
        if (mongoErr.code === 86) {
          console.log(`  ✓ Index already exists: ${JSON.stringify(index)}`)
        } else {
          console.error(`  ✗ Failed to create index: ${JSON.stringify(index)}`, mongoErr.message)
        }
      }
    }

    // Verify collections exist
    console.log('\nVerifying collections...')
    const collections = await mongoose.connection.db?.listCollections().toArray()
    const collectionNames = collections?.map((c) => c.name) || []

    if (collectionNames.includes('timeslots')) {
      console.log('  ✓ TimeSlot collection exists')
    } else {
      console.log('  ⚠ TimeSlot collection does not exist yet (will be created on first use)')
    }

    if (collectionNames.includes('blockprogresses')) {
      console.log('  ✓ BlockProgress collection exists')
    } else {
      console.log('  ⚠ BlockProgress collection does not exist yet (will be created on first use)')
    }

    console.log('\n✅ Migration completed successfully!')
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('\n❌ Migration failed:', errorMsg)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

// Run migration
migrate().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
