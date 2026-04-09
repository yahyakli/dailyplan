'use client'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Calendar, History, Trophy, Medal, User, Settings, TrendingUp } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage, useTranslations } from '@/lib/i18n/LanguageContext'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(true)
  const { isRtl } = useLanguage()
  const t = useTranslations()

  useEffect(() => {
    const darkModeActive = document.documentElement.classList.contains('dark')
    setIsDark(darkModeActive)
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
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

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 640) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const avatarEl = session?.user?.image ? (
    <img src={session.user.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
  ) : session?.user?.name ? (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {session.user.name[0].toUpperCase()}
    </div>
  ) : null

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#d1d1e0'}`,
        background: isDark ? 'rgba(10,10,15,0.9)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '0 clamp(16px, 4vw, 24px)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        direction: isRtl ? 'rtl' : 'ltr',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 'clamp(17px, 4vw, 20px)', fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span className="gradient-text">daily</span>
            <span style={{ color: 'var(--text)' }}>plan</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <div style={{ alignItems: 'center', gap: 4 }} className="hidden sm:flex">
          <NavLink href="/">{t('nav.plan')}</NavLink>
          <NavLink href="/history">{t('nav.history')}</NavLink>
          {session && <NavLink href="/progress">{t('nav.progress') || 'Progress'}</NavLink>}
          {!session && <NavLink href="/settings">{t('nav.settings')}</NavLink>}

          <LanguageSwitcher />

          {status === 'loading' ? (
            <div className="skeleton" style={{ marginLeft: 8, width: 84, height: 36, borderRadius: 24 }} />
          ) : session ? (
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
                {avatarEl}
                <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.user?.name?.split(' ')[0]}
                </span>
              </button>

              {profileMenuOpen && (
                <div style={{
                  position: 'absolute', [isRtl ? 'left' : 'right']: 0, top: 'calc(100% + 8px)',
                  background: isDark ? '#1a1a26' : '#f5f5fa',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#d1d1e0'}`,
                  borderRadius: 12, padding: 4, minWidth: 170, zIndex: 200,
                  boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.12)',
                }}>
                  <DropdownLink href="/profile" onClick={() => setProfileMenuOpen(false)}>{t('nav.profile')}</DropdownLink>
                  <DropdownLink href="/progress" onClick={() => setProfileMenuOpen(false)}>{t('nav.progress') || 'Progress'}</DropdownLink>
                  <DropdownLink href="/badges" onClick={() => setProfileMenuOpen(false)}>{t('nav.badges') || 'Badges'}</DropdownLink>
                  <DropdownLink href="/leaderboard" onClick={() => setProfileMenuOpen(false)}>{t('nav.leaderboard')}</DropdownLink>
                  <DropdownLink href="/settings" onClick={() => setProfileMenuOpen(false)}>{t('nav.settings')}</DropdownLink>
                  <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', margin: '4px 0' }} />
                  <button
                    onClick={() => { signOut({ callbackUrl: '/' }); setProfileMenuOpen(false) }}
                    style={{
                      width: '100%', padding: '8px 12px', textAlign: isRtl ? 'right' : 'left',
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
              marginLeft: 8, padding: '7px 18px',
              background: 'linear-gradient(135deg, var(--accent), #9b8af7)',
              borderRadius: 8, color: '#fff', fontSize: 13,
              fontWeight: 600, textDecoration: 'none',
              fontFamily: 'Syne',
            }}>
              {t('nav.signIn')}
            </Link>
          )}
        </div>

        {/* Mobile right side — avatar pill + hamburger */}
        <div style={{ alignItems: 'center', gap: 8 }} className="flex sm:hidden">
          {/* Show avatar / sign-in button on mobile bar */}
          {status === 'loading' ? (
            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          ) : session && avatarEl ? (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
              aria-label="Open menu"
            >
              {avatarEl}
            </button>
          ) : !session ? (
            <Link href="/auth/signin" style={{
              padding: '5px 12px',
              background: 'linear-gradient(135deg, var(--accent), #9b8af7)',
              borderRadius: 7, color: '#fff', fontSize: 12,
              fontWeight: 600, textDecoration: 'none',
              fontFamily: 'Syne', whiteSpace: 'nowrap',
            }}>
              {t('nav.signIn')}
            </Link>
          ) : null}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : '#efefff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d1e0'}`,
              borderRadius: 8, padding: 7,
              cursor: 'pointer', color: 'var(--text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, top: 56, zIndex: 90,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className="sm:hidden"
        style={{
          position: 'fixed', top: 56, left: 0, right: 0, zIndex: 95,
          background: isDark ? '#0e0e18' : '#f8f8fc',
          borderBottom: mobileMenuOpen ? `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#d1d1e0'}` : 'none',
          boxShadow: mobileMenuOpen ? (isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.1)') : 'none',
          maxHeight: mobileMenuOpen ? 'calc(100dvh - 56px)' : '0px',
          visibility: mobileMenuOpen ? 'visible' : 'hidden',
          opacity: mobileMenuOpen ? 1 : 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ padding: '12px 16px 20px' }}>

          {/* User info at top when signed in */}
          {session && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(124,106,247,0.06)',
              borderRadius: 12,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(124,106,247,0.15)'}`,
              marginBottom: 12,
            }}>
              {avatarEl}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.user?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.user?.email}
                </div>
              </div>
            </div>
          )}

          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)} icon={<Calendar size={18} />}>{t('nav.plan')}</MobileNavLink>
            <MobileNavLink href="/history" onClick={() => setMobileMenuOpen(false)} icon={<History size={18} />}>{t('nav.history')}</MobileNavLink>

            {status === 'loading' ? (
              <>
                <div className="skeleton" style={{ height: 44, borderRadius: 10, margin: '2px 0' }} />
                <div className="skeleton" style={{ height: 44, borderRadius: 10, margin: '2px 0' }} />
              </>
            ) : session ? (
              <>
                <MobileNavLink href="/progress" onClick={() => setMobileMenuOpen(false)} icon={<TrendingUp size={18} />}>{t('nav.progress') || 'Progress'}</MobileNavLink>
                <MobileNavLink href="/leaderboard" onClick={() => setMobileMenuOpen(false)} icon={<Trophy size={18} />}>{t('nav.leaderboard')}</MobileNavLink>
                <MobileNavLink href="/badges" onClick={() => setMobileMenuOpen(false)} icon={<Medal size={18} />}>{t('nav.badges') || 'Badges'}</MobileNavLink>
                <MobileNavLink href="/profile" onClick={() => setMobileMenuOpen(false)} icon={<User size={18} />}>{t('nav.profile')}</MobileNavLink>
                <MobileNavLink href="/settings" onClick={() => setMobileMenuOpen(false)} icon={<Settings size={18} />}>{t('nav.settings')}</MobileNavLink>
              </>
            ) : (
              <MobileNavLink href="/settings" onClick={() => setMobileMenuOpen(false)} icon={<Settings size={18} />}>{t('nav.settings')}</MobileNavLink>
            )}
          </div>

          {/* Language + Sign out */}
          <div style={{
            marginTop: 12, paddingTop: 12,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e0e0ee'}`,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
              <LanguageSwitcher align={isRtl ? 'right' : 'left'} direction="up" />
            </div>

            {session ? (
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); setMobileMenuOpen(false) }}
                style={{
                  width: '100%', padding: '12px 14px',
                  textAlign: isRtl ? 'right' : 'left',
                  background: 'rgba(247,92,106,0.08)',
                  border: '1px solid rgba(247,92,106,0.2)',
                  color: '#f75c6a',
                  cursor: 'pointer', borderRadius: 10, fontSize: 13,
                  fontWeight: 600, fontFamily: 'Syne',
                  transition: 'background 0.15s',
                }}
              >
                {t('nav.signOut')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
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

function MobileNavLink({ href, children, onClick, icon }: { href: string; children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} style={{
      color: 'var(--text)', fontSize: 14, fontWeight: 500,
      padding: '12px 14px', borderRadius: 10, textDecoration: 'none',
      transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: 12,
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,106,247,0.06)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, flexShrink: 0, color: 'var(--muted)' }}>{icon}</span>}
      {children}
    </Link>
  )
}

function DropdownLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
      color: 'var(--muted)', fontWeight: 500,
      textDecoration: 'none', borderRadius: 6, fontSize: 13,
      transition: 'color 0.15s, background 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(124,106,247,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </Link>
  )
}