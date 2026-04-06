import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'Email',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()
        const user = await User.findOne({ email: credentials.email.toLowerCase() })
        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id:    user._id.toString(),
          email: user.email,
          name:  user.name,
          image: user.image,
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      // Auto-create user on Google sign-in
      if (account?.provider === 'google') {
        await connectDB()
        const existing = await User.findOne({ email: user.email!.toLowerCase() })
        if (!existing) {
          await User.create({
            name:     user.name,
            email:    user.email!.toLowerCase(),
            image:    user.image,
            provider: 'google',
          })
        }
      }
      return true
    },

    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session?.name) {
        token.name = session.name
      }
      if (user) {
        await connectDB()
        const dbUser = await User.findOne({ email: token.email! })
        if (dbUser) token.id = dbUser._id.toString()
      }
      return token
    },

    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id?: string }).id = token.id as string
        if (token.name) {
          session.user.name = token.name as string
        }
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/signin',
  },
})

export { handler as GET, handler as POST }