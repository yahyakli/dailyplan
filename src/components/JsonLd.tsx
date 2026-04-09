import React from 'react'

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "DailyPlan",
    "description": "Transform your brain dump into a time-blocked day plan powered by Mistral AI.",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "AI-powered daily scheduling",
      "Time blocking",
      "Mistral AI integration",
      "Gamification (streaks, points, badges)",
      "Multi-language support (EN, FR, AR)"
    ],
    "author": {
      "@type": "Person",
      "name": "yahyakli"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
