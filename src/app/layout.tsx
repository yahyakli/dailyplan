import type { Metadata } from 'next'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/JsonLd'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL('https://dailyplan-org.vercel.app'),
  title: {
    default: 'DailyPlan — AI Daily Scheduler',
    template: '%s | DailyPlan'
  },
  description: 'Transform your brain dump into a time-blocked day plan powered by Mistral AI. Optimized for productivity and consistency.',
  keywords: ['AI Daily Planner', 'Time Blocking', 'Daily Scheduler', 'Mistral AI', 'Productivity Tool', 'Task Management', 'Automatic Scheduling'],
  authors: [{ name: 'yahyakli' }],
  creator: 'yahyakli',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dailyplan-org.vercel.app',
    siteName: 'DailyPlan',
    title: 'DailyPlan — AI Daily Scheduler',
    description: 'Transform your brain dump into a time-blocked day plan powered by Mistral AI.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'DailyPlan AI Scheduler',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DailyPlan — AI Daily Scheduler',
    description: 'AI-powered daily scheduling with zero friction.',
    images: ['/opengraph-image.png'],
    creator: '@yahyakli',
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'fr-FR': '/fr',
      'ar-SA': '/ar',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body suppressHydrationWarning>
        <Providers>
          <JsonLd />
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}