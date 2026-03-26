'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getApiKey, setApiKey, clearApiKey } from '@/lib/storage'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    const existing = getApiKey()
    if (existing) { setKey(existing); setHasKey(true) }
  }, [])

  const handleSave = () => {
    if (!key.trim()) {
      toast.error('API key cannot be empty')
      return
    }
    setApiKey(key.trim())
    setHasKey(true)
    setSaved(true)
    toast.success('API key saved! Redirecting...')
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }

  const handleClear = () => {
    clearApiKey()
    setKey('')
    setHasKey(false)
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <div className="fade-up">
        <p style={{ fontSize: 12, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>
          Configuration
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Settings</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 36 }}>
          Your Mistral API key is stored only in your browser — never sent to our servers.
        </p>

        <div className="glass" style={{ borderRadius: 14, padding: 28 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>
            Mistral API Key
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="your-mistral-api-key"
              style={{
                flex: 1, padding: '11px 14px',
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', fontSize: 14,
                fontFamily: 'monospace', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} style={{
              padding: '11px 20px',
              background: saved
                ? 'rgba(62,207,150,0.2)'
                : 'linear-gradient(135deg, var(--accent), #9b8af7)',
              border: saved ? '1px solid rgba(62,207,150,0.4)' : 'none',
              borderRadius: 8, color: saved ? '#3ecf96' : '#fff',
              fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', minWidth: 80, transition: 'all 0.2s',
            }}>
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>

          {hasKey && (
            <button onClick={handleClear} style={{
              marginTop: 10, background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: 0,
            }}>
              Remove key
            </button>
          )}

          <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Don&apos;t have a key?{' '}
              <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                Get one free at Mistral →
              </a>
              <br />
              It&apos;s free, takes 2 minutes, and requires no credit card.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}