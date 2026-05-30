import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Invalid token or password (min 8 chars).' }, { status: 400 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ 
      _id: decoded.id,
      email: decoded.email,
      resetToken: token 
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid token or user not found.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    user.password = hashedPassword
    user.resetToken = undefined // Clear the token
    await user.save()

    return NextResponse.json({ message: 'Password reset successful. You can now log in.' })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
