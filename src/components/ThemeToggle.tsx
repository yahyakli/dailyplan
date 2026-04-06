'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTranslations } from '@/lib/i18n/LanguageContext'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Syne',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            marginBottom: 12,
          }}
        >
          {typeof t('settings.appearance') === 'string' ? t('settings.appearance') : 'Appearance'}
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
          className="sm:grid-cols-3 xs:grid-cols-3"
        >
          {[
            { value: 'light', label: typeof t('settings.light') === 'string' ? t('settings.light') : 'Light', icon: Sun },
            { value: 'dark', label: typeof t('settings.dark') === 'string' ? t('settings.dark') : 'Dark', icon: Moon },
            { value: 'system', label: typeof t('settings.system') === 'string' ? t('settings.system') : 'System', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: theme === value ? 'var(--surface)' : 'transparent',
                color: theme === value ? 'var(--accent)' : 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'Syne',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = theme === value ? 'var(--surface)' : 'rgba(124,106,247,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = theme === value ? 'var(--surface)' : 'transparent';
              }}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        <p>{typeof t('settings.appearanceDesc') === 'string' ? t('settings.appearanceDesc') : 'Choose how DailyPlan appears on your device. Light mode is perfect for daytime use, while dark mode is easier on your eyes at night.'}</p>
      </div>
    </div>
  )
}
