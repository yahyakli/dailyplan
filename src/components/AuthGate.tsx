'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface Props {
  children: React.ReactNode
  /** If true, shows a prompt instead of redirecting */
  soft?: boolean
  /** Custom message for soft gate */
  message?: string
}

/**
 * AuthGate — wraps content that requires authentication.
 *
 * Hard mode (default): redirects to /auth/signin if not logged in.
 * Soft mode: shows an inline sign-up prompt instead of redirecting.
 * Useful for features like the leaderboard where guests can see a teaser.
 */
export default function AuthGate({ children, soft = false, message }: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!soft && status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [soft, status, router])

  // Still loading
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '24px 0' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 56, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    )
  }

  // Authenticated — render children
  if (session) return <>{children}</>

  // Soft gate — show inline prompt
  if (soft) {
    return (
      <div style={{
        padding: '40px 24px', textAlign: 'center',
        background: 'rgba(124,106,247,0.05)',
        border: '1px solid rgba(124,106,247,0.2)',
        borderRadius: 14,
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
        <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
          Sign in to access this
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 320, margin: '0 auto 24px' }}>
          {message || 'Create a free account to unlock this feature and track your productivity.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/auth/signup" style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, var(--accent), #9b8af7)',
            borderRadius: 8, color: '#fff', textDecoration: 'none',
            fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
          }}>
            Sign up free →
          </a>
          <a href="/auth/signin" style={{
            padding: '10px 22px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--muted)', textDecoration: 'none',
            fontFamily: 'Syne', fontWeight: 600, fontSize: 14,
          }}>
            Sign in
          </a>
        </div>
      </div>
    )
  }

  // Hard gate — render nothing while redirect happens
  return null
}