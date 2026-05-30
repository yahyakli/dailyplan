import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { resend } from '@/lib/resend'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // For security, don't reveal if user exists
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
    }

    if (user.provider === 'google') {
      return NextResponse.json({ error: 'Google accounts cannot reset password here.' }, { status: 400 })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '15m' }
    )

    user.resetToken = token
    await user.save()

    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'DailyPlan <noreply@dailyplan.app>',
      to: user.email,
      subject: 'Reset your DailyPlan password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password for DailyPlan.</p>
          <p>Click the button below to set a new password. This link expires in 15 minutes.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
