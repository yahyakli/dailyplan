import type { Metadata } from 'next'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/JsonLd'
import './globals.css'
import { Geist, Noto_Kufi_Arabic } from "next/font/google";
import { cn } from "@/lib/utils";
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const notoKufi = Noto_Kufi_Arabic({ subsets: ['arabic'], variable: '--font-arabic' });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL('https://dailyplan-org.vercel.app'),
  title: {
    default: 'DailyPlan — AI Daily Scheduler',
    template: '%s | DailyPlan'
  },
  description: 'Transform your brain dump into a time-blocked day plan powered by AI. Optimized for productivity and consistency.',
  keywords: ['AI Daily Planner', 'Time Blocking', 'Daily Scheduler', 'AI', 'Productivity Tool', 'Task Management', 'Automatic Scheduling'],
  authors: [{ name: 'yahyakli' }],
  creator: 'yahyakli',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dailyplan-org.vercel.app',
    siteName: 'DailyPlan',
    title: 'DailyPlan — AI Daily Scheduler',
    description: 'Transform your brain dump into a time-blocked day plan powered by AI.',
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
      'en': '/en',
      'fr': '/fr',
      'ar': '/ar',
    },
  },
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  const isRtl = locale === 'ar';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning className={cn("font-sans", geist.variable, notoKufi.variable)}>
      <body suppressHydrationWarning className={locale === 'ar' ? 'font-arabic' : 'font-sans'}>
        <Providers messages={messages} locale={locale}>
          <JsonLd />
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
