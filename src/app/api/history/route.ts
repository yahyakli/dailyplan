import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Plan } from '@/models/Plan'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '10')

    const query: any = { userId: user._id, isArchived: false }
    if (cursor) {
      query.planDate = { $lt: new Date(cursor) }
    }

    const plans = await Plan.find(query)
      .sort({ planDate: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = plans.length > limit
    const items = hasMore ? plans.slice(0, limit) : plans
    const nextCursor = hasMore ? items[items.length - 1].planDate : null

    return NextResponse.json({
      items,
      nextCursor
    })
  } catch (err) {
    console.error('History API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
