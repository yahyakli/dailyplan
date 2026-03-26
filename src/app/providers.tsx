'use client'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Toaster position="top-center" />
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}