import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()
        const user = await User.findOne({ email: (credentials.email as string).toLowerCase() })
        
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar || user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()
          const existingUser = await User.findOne({ email: user.email?.toLowerCase() })
          
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email?.toLowerCase(),
              avatar: user.image,
              image: user.image, // Keep for compatibility
              provider: 'google',
              googleId: account.providerAccountId,
            })
          } else if (existingUser.provider !== 'google') {
            // Link googleId if user exists but signed in with credentials before?
            // Or just allow sign in if email matches. 
            // Blueprint says "Upsert user on first sign-in"
            existingUser.googleId = account.providerAccountId
            existingUser.provider = 'google' // Switch or allow both? Blueprint says provider is enum
            await existingUser.save()
          }
        } catch (error) {
          console.error('Error during Google sign-in:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
      }
      if (trigger === 'update' && session) {
        token.name = session.name || token.name
        token.picture = session.image || token.picture
      }
      return token
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
})
