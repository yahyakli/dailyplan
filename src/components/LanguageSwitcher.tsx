'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { locales, type Locale } from '@/lib/i18n/config'
import { Globe } from 'lucide-react'

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  ar: 'AR',
}

const localeFullNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
}

export default function LanguageSwitcher({ align, direction = 'down' }: { align?: 'left' | 'right', direction?: 'up' | 'down' } = {}) {
  const { locale, setLocale, isRtl } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'Syne',
          letterSpacing: '0.04em',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        aria-label={`Switch language, currently ${localeFullNames[locale]}`}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}><Globe size={14} strokeWidth={2} /></span>
        <span>{localeLabels[locale]}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(align ? { [align]: 0 } : { [isRtl ? 'left' : 'right']: 0 }),
            ...(direction === 'up' ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 4,
            minWidth: 150,
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          {locales.map(lng => (
            <button
              key={lng}
              onClick={() => handleLocaleChange(lng)}
              style={{
                width: '100%',
                padding: '9px 12px',
                textAlign: 'left',
                background: locale === lng ? 'rgba(124, 106, 247, 0.1)' : 'none',
                border: 'none',
                color: locale === lng ? 'var(--accent)' : 'var(--muted)',
                cursor: 'pointer',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: locale === lng ? 600 : 400,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
              onMouseEnter={e => {
                if (locale !== lng) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
                }
              }}
              onMouseLeave={e => {
                if (locale !== lng) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
                }
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 700, fontFamily: 'Syne',
                letterSpacing: '0.05em', minWidth: 24,
                color: locale === lng ? 'var(--accent)' : 'var(--muted)',
              }}>
                {localeLabels[lng]}
              </span>
              <span>{localeFullNames[lng]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
