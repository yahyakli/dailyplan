'use client'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <SessionProvider>
          <Toaster position="top-center" />
          {children}
        </SessionProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
