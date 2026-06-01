'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function SettingsPage() {
  const t = useTranslations()
  const { data: session, update } = useSession()

  const [name, setName] = useState(session?.user?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), image: avatarUrl.trim() })
      })
      if (!res.ok) throw new Error('Failed to update')
      await update({ name: name.trim(), image: avatarUrl.trim() })
      toast.success(t('common.success'))
    } catch (e) {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 fade-up space-y-8">
      <h1 className="text-3xl font-bold font-heading">{t('settings.title')}</h1>

      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-bold font-heading">{t('settings.accountSection')}</h2>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>{t('settings.nameLabel')}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('settings.avatarLabel') || 'Avatar URL'}</Label>
            <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? t('settings.saving') : t('settings.save')}</Button>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-bold font-heading">{t('settings.preferences')}</h2>
        
        <div className="flex items-center justify-between">
          <Label>{t('settings.theme')}</Label>
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between">
          <Label>{t('settings.language')}</Label>
          <LanguageSwitcher />
        </div>
      </Card>
    </div>
  )
}