'use client'
import { useEffect, useState } from 'react'
import { getApiKey } from '@/lib/storage'
import { useTranslations } from '@/lib/i18n/LanguageContext'

export default function KeyGate({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const t = useTranslations()

  useEffect(() => {
    setHasKey(!!getApiKey())
  }, [])

  if (hasKey === null) return null // avoid hydration flash

  if (!hasKey) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div className="glass fade-up" style={{
          maxWidth: 480, width: '100%',
          borderRadius: 16, padding: 40, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔑</div>
          <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            {t('keygate.title')}
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28, fontSize: 14 }}>
            {t('keygate.description')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href="https://console.mistral.ai/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', padding: '11px 20px',
                background: 'linear-gradient(135deg, var(--accent), #9b8af7)',
                borderRadius: 8, color: '#fff', textDecoration: 'none',
                fontFamily: 'Syne', fontWeight: 600, fontSize: 14,
              }}
            >
              {t('keygate.getKey')}
            </a>
            <a href="/settings" style={{
              display: 'block', padding: '11px 20px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', textDecoration: 'none',
              fontFamily: 'Syne', fontWeight: 600, fontSize: 14,
            }}>
              {t('keygate.goSettings')}
            </a>
          </div>

          <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 20 }}>
            {t('keygate.privacy')}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}