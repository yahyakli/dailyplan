'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Signup failed'); setLoading(false); return }

    // Auto sign in after successful registration
    await signIn('credentials', { email, password, redirect: false })
    router.push('/')
  }

  const handleGoogle = () => signIn('google', { callbackUrl: '/' })

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 4vw, 24px)' }}>
      <div className="glass fade-up" style={{ maxWidth: 420, width: '100%', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px)' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 'clamp(22px, 6vw, 26px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
          Create account
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 2vw, 14px)', marginBottom: 28 }}>
          Join the leaderboard and track your planning streaks.
        </p>

        <button onClick={handleGoogle} style={{
          width: '100%', padding: '11px 16px', marginBottom: 20,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--text)', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'border-color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--muted)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Name" type="text" value={name} onChange={setName} />
          <Input label="Email" type="email" value={email} onChange={setEmail} />
          <Input label="Password" type="password" value={password} onChange={setPassword} onEnter={handleSubmit} />
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(247,92,106,0.1)', border: '1px solid rgba(247,92,106,0.3)', borderRadius: 8, color: '#f75c6a', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', marginTop: 16, padding: '12px',
          background: loading ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #9b8af7)',
          border: 'none', borderRadius: 8, color: '#fff',
          fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function Input({ label, type, value, onChange, onEnter }: {
  label: string; type: string; value: string
  onChange: (v: string) => void; onEnter?: () => void
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        style={{ width: '100%', padding: '11px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, fontFamily: 'DM Sans', outline: 'none', transition: 'border-color 0.15s' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}