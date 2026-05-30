export const locales = ['en', 'fr', 'ar'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
}

// Detect user's language based on browser or system locale
export function getDefaultLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  // Check if there's a saved preference
  const saved = localStorage.getItem('locale')
  if (saved && locales.includes(saved as Locale)) {
    return saved as Locale
  }

  // Get browser language
  const browserLang = navigator.language.split('-')[0].toLowerCase()
  
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale
  }

  return defaultLocale
}

// Map common language codes to our locales
export function normalizeLocale(lang: string): Locale {
  const normalized = lang.split('-')[0].toLowerCase()
  if (locales.includes(normalized as Locale)) {
    return normalized as Locale
  }
  return defaultLocale
}
