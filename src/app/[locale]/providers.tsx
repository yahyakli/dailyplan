'use client'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl'

export function Providers({ 
  children, 
  messages, 
  locale 
}: { 
  children: React.ReactNode,
  messages: AbstractIntlMessages,
  locale: string
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <ThemeProvider>
        <SessionProvider>
          <Toaster position="top-center" />
          {children}
        </SessionProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
