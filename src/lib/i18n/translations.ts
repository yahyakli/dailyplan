import { Locale } from './config'

interface Translations {
  [key: string]: string | Record<string, string | Record<string, string>>
}

const cachedTranslations: Record<string, Translations> = {}

export async function loadTranslations(locale: Locale): Promise<Translations> {
  if (cachedTranslations[locale]) {
    return cachedTranslations[locale]
  }

  try {
    const response = await fetch(`/locales/${locale}/common.json`)
    const translations = await response.json()
    cachedTranslations[locale] = translations
    return translations
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error)
    return {}
  }
}

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((current, prop) => {
    if (current && typeof current === 'object' && prop in current) {
      return (current as Record<string, unknown>)[prop]
    }
    return null
  }, obj as unknown) as string || path
}

export function t(translations: Translations, key: string): string {
  return getNestedValue(translations as Record<string, unknown>, key)
}
