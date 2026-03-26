'use client'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage, useTranslations } from '@/lib/i18n/LanguageContext'

export default function Navbar() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(true)
  const { isRtl } = useLanguage()
  const t = useTranslations()

  useEffect(() => {
    // Check if dark mode is enabled
    const darkModeActive = document.documentElement.classList.contains('dark')
    setIsDark(darkModeActive)
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const darkModeActive = document.documentElement.classList.contains('dark')
      setIsDark(darkModeActive)
    })
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!profileMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileMenuOpen])

  const navStyle = {
    position: 'sticky' as const, 
    top: 0, 
    zIndex: 50,
    borderBottom: `1px solid ${isDark ? 'var(--border)' : '#d1d1e0'}`,
    background: isDark ? 'rgba(10,10,15,0.85)' : 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(12px)',
    padding: '0 clamp(16px, 4vw, 24px)',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    direction: isRtl ? 'rtl' as const : 'ltr' as const,
  }

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-0.03em' }}>
          <span className="gradient-text">daily</span>
          <span style={{ color: 'var(--text)' }}>plan</span>
        </span>
      </Link>

      {/* Desktop Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden sm:flex">
        <NavLink href="/">{t('nav.plan')}</NavLink>
        <NavLink href="/history">{t('nav.history')}</NavLink>
        {session && <NavLink href="/leaderboard">{t('nav.leaderboard')}</NavLink>}
        {session && <NavLink href="/profile">{t('nav.profile')}</NavLink>}
        <NavLink href="/settings">{t('nav.settings')}</NavLink>

        <LanguageSwitcher />

        {session ? (
          <div ref={profileMenuRef} style={{ position: 'relative', marginLeft: 8 }}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: isDark ? 'var(--surface)' : '#efefff',
                border: `1px solid ${isDark ? 'var(--border)' : '#d1d1e0'}`,
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

            {profileMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: isDark ? 'var(--surface)' : '#f5f5fa',
                border: `1px solid ${isDark ? 'var(--border)' : '#d1d1e0'}`,
                borderRadius: 10, padding: 4, minWidth: 140, zIndex: 100,
              }}>
                <button
                  onClick={() => { signOut({ callbackUrl: '/' }); setProfileMenuOpen(false) }}
                  style={{
                    width: '100%', padding: '8px 12px', textAlign: 'left',
                    background: 'none', border: 'none', 
                    color: 'var(--muted)',
                    cursor: 'pointer', borderRadius: 6, fontSize: 13,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  {t('nav.signOut')}
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
            {t('nav.signIn')}
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: 'none',
          background: isDark ? 'var(--surface)' : '#efefff',
          border: `1px solid ${isDark ? 'var(--border)' : '#d1d1e0'}`,
          borderRadius: 6, padding: 6,
          cursor: 'pointer', color: 'var(--text)',
        }}
        className="sm:hidden flex"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: '56px', left: 0, right: 0,
          background: isDark ? 'var(--surface)' : '#f5f5fa',
          borderBottom: `1px solid ${isDark ? 'var(--border)' : '#d1d1e0'}`,
          display: 'flex', flexDirection: 'column', gap: 4, padding: '12px',
          maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
        }}>
          <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>{t('nav.plan')}</MobileNavLink>
          <MobileNavLink href="/history" onClick={() => setMobileMenuOpen(false)}>{t('nav.history')}</MobileNavLink>
          {session && <MobileNavLink href="/leaderboard" onClick={() => setMobileMenuOpen(false)}>{t('nav.leaderboard')}</MobileNavLink>}
          {session && <MobileNavLink href="/profile" onClick={() => setMobileMenuOpen(false)}>{t('nav.profile')}</MobileNavLink>}
          <MobileNavLink href="/settings" onClick={() => setMobileMenuOpen(false)}>{t('nav.settings')}</MobileNavLink>

          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0 0 0', marginBottom: 8 }}>
            <LanguageSwitcher />
          </div>

          <div style={{ borderTop: `1px solid ${isDark ? 'var(--border)' : '#d1d1e0'}`, marginTop: 8, paddingTop: 8 }}>
            {session ? (
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); setMobileMenuOpen(false) }}
                style={{
                  width: '100%', padding: '8px 12px', textAlign: 'left',
                  background: 'none', border: 'none', 
                  color: 'var(--muted)',
                  cursor: 'pointer', borderRadius: 6, fontSize: 13,
                }}
              >
                {t('nav.signOut')}
              </button>
            ) : (
              <Link href="/auth/signin" style={{
                display: 'block', padding: '8px 12px',
                background: 'linear-gradient(135deg, var(--accent), #9b8af7)',
                borderRadius: 6, color: '#fff', fontSize: 13,
                fontWeight: 600, textDecoration: 'none',
                textAlign: 'center',
              }}>
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      color: 'var(--muted)', 
      fontSize: 13, fontWeight: 500,
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

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      color: 'var(--muted)', fontSize: 13, fontWeight: 500,
      padding: '10px 12px', borderRadius: 6, textDecoration: 'none',
      transition: 'all 0.15s', display: 'block',
    }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
    >
      {children}
    </Link>
  )
}