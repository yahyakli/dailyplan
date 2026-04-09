import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DailyPlan — AI Daily Scheduler',
    short_name: 'DailyPlan',
    description: 'Transform your brain dump into a time-blocked day plan powered by Mistral AI',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#7c6af7',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
