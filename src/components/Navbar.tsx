'use client'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(12px)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-0.03em' }}>
          <span className="gradient-text">daily</span>
          <span style={{ color: 'var(--text)' }}>plan</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink href="/">Plan</NavLink>
        <NavLink href="/history">History</NavLink>
        {session && <NavLink href="/leaderboard">Leaderboard</NavLink>}
        {session && <NavLink href="/profile">Profile</NavLink>}
        <NavLink href="/settings">Settings</NavLink>

        {session ? (
          <div style={{ position: 'relative', marginLeft: 8 }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 24, padding: '4px 12px 4px 6px',
                cursor: 'pointer', color: 'var(--text)',
              }}
            >
              {session.user?.image ? (
                <img src={session.user.image} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
              ) : (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {session.user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user?.name?.split(' ')[0]}
              </span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 4, minWidth: 140, zIndex: 100,
              }}>
                <button
                  onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false) }}
                  style={{
                    width: '100%', padding: '8px 12px', textAlign: 'left',
                    background: 'none', border: 'none', color: 'var(--muted)',
                    cursor: 'pointer', borderRadius: 6, fontSize: 13,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/signin" style={{
            marginLeft: 8, padding: '6px 16px',
            background: 'linear-gradient(135deg, var(--accent), #9b8af7)',
            borderRadius: 8, color: '#fff', fontSize: 13,
            fontWeight: 600, textDecoration: 'none',
            fontFamily: 'Syne',
          }}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      color: 'var(--muted)', fontSize: 13, fontWeight: 500,
      padding: '6px 10px', borderRadius: 6, textDecoration: 'none',
      transition: 'color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
    >
      {children}
    </Link>
  )
}