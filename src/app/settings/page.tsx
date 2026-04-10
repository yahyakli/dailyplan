'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTranslations } from '@/lib/i18n/LanguageContext'

export default function SettingsPage() {
  const t = useTranslations()
  const { data: session, update } = useSession()

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)



  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })
      if (!res.ok) throw new Error('Failed to update')
      await update({ name: name.trim() })
      toast.success(t('common.success') || 'Success')
    } catch (e) {
      toast.error(t('common.error') || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || newPassword.length < 6) return
    setChangingPassword(true)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update password')
      toast.success(t('settings.passwordChanged') || 'Password updated')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e: any) {
      toast.error(e.message || t('common.error'))
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
      await signOut({ callbackUrl: '/' })
    } catch (e: any) {
      toast.error(t('common.error') || 'Error deleting account')
      setDeleting(false)
    }
  }


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


        {/* Account Info Section */}
        {session && (
          <div className="glass" style={{ borderRadius: 14, padding: 'clamp(20px, 4vw, 28px)', marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 16 }}>
              {t('settings.accountSection')}
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{t('settings.emailLabel')}</label>
                <input
                  type="email"
                  value={session.user?.email || ''}
                  disabled
                  title={typeof t('settings.emailReadOnly') === 'string' ? t('settings.emailReadOnly') as string : ''}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--muted)', fontSize: 14,
                    outline: 'none', cursor: 'not-allowed',
                    opacity: 0.6
                  }}
                />
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, opacity: 0.8 }}>{t('settings.emailReadOnly')}</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{t('settings.nameLabel')}</label>
                <div style={{ display: 'flex', gap: 8 }} className="xs:flex-col sm:flex-row">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      flex: 1, padding: '11px 14px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--text)', fontSize: 14,
                      outline: 'none', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    onKeyDown={e => e.key === 'Enter' && !saving && name.trim() !== session.user?.name && handleSave()}
                  />
                  <button 
                    onClick={handleSave} 
                    disabled={saving || !name.trim() || name.trim() === session.user?.name} 
                    style={{
                      padding: '11px 20px',
                      background: (saving || !name.trim() || name.trim() === session.user?.name) 
                          ? 'var(--surface)' 
                          : 'linear-gradient(135deg, var(--accent), #9b8af7)',
                      border: (saving || !name.trim() || name.trim() === session.user?.name) ? '1px solid var(--border)' : 'none',
                      borderRadius: 8, 
                      color: (saving || !name.trim() || name.trim() === session.user?.name) ? 'var(--muted)' : '#fff',
                      fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
                      cursor: (saving || !name.trim() || name.trim() === session.user?.name) ? 'not-allowed' : 'pointer', 
                      minWidth: 80, transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {saving ? t('settings.saving') : t('settings.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone Section */}
        {session && (
          <div className="glass" style={{ borderRadius: 14, padding: 'clamp(20px, 4vw, 28px)', border: '1px solid rgba(255, 60, 60, 0.2)', backgroundColor: 'rgba(255, 60, 60, 0.02)' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ff4d4d', marginBottom: 16 }}>
              {typeof t('settings.dangerZone') === 'string' ? t('settings.dangerZone') : 'Danger Zone'}
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Change Password */}
              <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                  {typeof t('settings.changePassword') === 'string' ? t('settings.changePassword') : 'Change Password'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="password"
                    placeholder={typeof t('settings.currentPassword') === 'string' ? t('settings.currentPassword') as string : 'Current Password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none'
                    }}
                  />
                  <input
                    type="password"
                    placeholder={typeof t('settings.newPassword') === 'string' ? t('settings.newPassword') as string : 'New Password (min 6 chars)'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none'
                    }}
                  />
                  <button 
                    onClick={handleChangePassword} 
                    disabled={changingPassword || !currentPassword || newPassword.length < 6}
                    style={{
                      padding: '11px 20px', alignSelf: 'flex-start',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--text)', fontSize: 13, fontWeight: 600,
                      cursor: (changingPassword || !currentPassword || newPassword.length < 6) ? 'not-allowed' : 'pointer',
                      opacity: (changingPassword || !currentPassword || newPassword.length < 6) ? 0.6 : 1
                    }}
                  >
                    {changingPassword ? t('settings.saving') : t('settings.changePassword')}
                  </button>
                </div>
              </div>

              {/* Delete Account */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#ff4d4d', marginBottom: 8 }}>
                  {typeof t('settings.deleteAccount') === 'string' ? t('settings.deleteAccount') : 'Delete Account'}
                </label>
                <p style={{ fontSize: 13, color: '#ff4d4d', opacity: 0.8, marginBottom: 16 }}>
                  {typeof t('settings.deleteConfirmation') === 'string' ? t('settings.deleteConfirmation') : 'Type DELETE to confirm'}
                </p>
                <div style={{ display: 'flex', gap: 8 }} className="xs:flex-col sm:flex-row">
                  <input
                    type="text"
                    placeholder={typeof t('settings.deletePlaceholder') === 'string' ? t('settings.deletePlaceholder') as string : 'Type DELETE'}
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    style={{
                      flex: 1, padding: '11px 14px',
                      background: 'rgba(255,60,60,0.05)', border: '1px solid rgba(255,60,60,0.2)',
                      borderRadius: 8, color: '#ff4d4d', fontSize: 14, outline: 'none'
                    }}
                  />
                  <button 
                    onClick={handleDeleteAccount} 
                    disabled={deleting || deleteConfirm !== 'DELETE'}
                    style={{
                      padding: '11px 20px',
                      background: '#ff4d4d', border: 'none',
                      borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: (deleting || deleteConfirm !== 'DELETE') ? 'not-allowed' : 'pointer',
                      opacity: (deleting || deleteConfirm !== 'DELETE') ? 0.5 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {deleting ? (typeof t('settings.deleting') === 'string' ? t('settings.deleting') : 'Deleting...') : (typeof t('settings.deleteAccount') === 'string' ? t('settings.deleteAccount') : 'Delete Account')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}