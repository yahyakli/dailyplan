'use client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTranslations } from '@/lib/i18n/LanguageContext'

export default function SettingsPage() {
  const t = useTranslations()

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px)' }} className="px-4 sm:px-6">
      <div className="fade-up">
        <p style={{ fontSize: 'clamp(11px, 2vw, 12px)', fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>
          {t('settings.configuration')}
        </p>
        <h1 style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>{t('settings.title')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 2.5vw, 15px)', marginBottom: 32 }}>
          {t('settings.subtitle')}
        </p>

        {/* Theme Section */}
        <div className="glass" style={{ borderRadius: 14, padding: 'clamp(20px, 4vw, 28px)', marginBottom: 24 }}>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}