import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { buildPrompt } from '@/lib/buildPrompt'
import { parseSchedule } from '@/lib/parseSchedule'
import { connectDB } from '@/lib/mongodb'
import { Plan } from '@/models/Plan'
import { User } from '@/models/User'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { tasks, startTime, endTime, context, date, locale } = await req.json()

    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing MISTRAL_API_KEY' }, { status: 500 })
    }

    if (!tasks || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build prompt and call Mistral
    const { systemPrompt, userPrompt } = buildPrompt(tasks, startTime, endTime, context, date, locale)

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      let message = error.message || 'Mistral API error'
      
      // Provide more specific error messages
      if (response.status === 401) {
        message = 'Invalid Mistral API key configured on the server.'
      } else if (response.status === 429) {
        message = 'Rate limit exceeded. Please try again in a moment.'
      }
      
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const data = await response.json()
    const raw = data.choices[0].message.content
    const plan = parseSchedule(raw)

    // If authenticated, save plan to MongoDB
    const session = await getServerSession()
    if (session?.user?.email) {
      await connectDB()
      const user = await User.findOne({ email: session.user.email })
      if (user) {
        await Plan.findOneAndUpdate(
          { userId: user._id, date: plan.date },
          { ...plan, userId: user._id, rawInput: tasks },
          { upsert: true, new: true }
        )
      }
    }

    return NextResponse.json(plan)

  } catch (err: unknown) {
    console.error('Plan API error:', err)
    const message = err instanceof Error ? err.message : 'Failed to generate schedule'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}