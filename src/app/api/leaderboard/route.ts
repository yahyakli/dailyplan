import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { XPLog } from '@/models/XPLog'
import { Plan } from '@/models/Plan'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'alltime'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const session = await auth()
    await connectDB()

    const today = new Date()
    const match: any = {}

    if (period === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      match.earnedAt = { $gte: firstDayOfMonth }
    } else if (period === 'week') {
      const firstDayOfWeek = new Date(today)
      firstDayOfWeek.setDate(today.getDate() - today.getDay())
      match.earnedAt = { $gte: firstDayOfWeek }
    }

    // Aggregate ranking
    const pipeline: any[] = [
      { $match: match },
      { $group: { _id: '$userId', totalXP: { $sum: '$xp' } } },
      { $sort: { totalXP: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          image: '$user.avatar',
          points: '$totalXP',
        }
      }
    ]

    // If All-Time, just sort users by points
    let entries: any[] = []
    if (period === 'alltime') {
       entries = await User.find({ isDeleted: false })
        .sort({ points: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('name avatar points')
        .lean()
        .then(users => users.map(u => ({
            userId: u._id,
            name: u.name,
            image: u.avatar,
            points: u.points
        })))
    } else {
        entries = await XPLog.aggregate(pipeline)
    }

    const leaderboard = entries.map((e, idx) => ({
      ...e,
      rank: ((page - 1) * limit) + idx + 1
    }))

    return NextResponse.json({
        rankings: leaderboard,
        total: await User.countDocuments({ isDeleted: false })
    })

  } catch (err) {
    console.error('Leaderboard error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}