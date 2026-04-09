import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dailyplan-org.vercel.app'
  
  const routes = [
    '',
    '/auth/signin',
    '/auth/signup',
    '/settings',
    '/leaderboard',
    '/history',
    '/profile',
    '/progress',
    '/badges',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))
}
