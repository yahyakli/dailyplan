'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Locale, getDefaultLocale, locales } from './config'
import { loadTranslations } from './translations'

type Translations = Record<string, string | Record<string, string | Record<string, string>>>

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  translations: Translations
  isRtl: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [translations, setTranslations] = useState<Translations>({})
  const [isRtl, setIsRtl] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize locale and translations on mount
  useEffect(() => {
    const initLocale = async () => {
      const defaultLocale = getDefaultLocale()
      setLocaleState(defaultLocale)
      setIsRtl(defaultLocale === 'ar')
      
      const trans = await loadTranslations(defaultLocale)
      setTranslations(trans as Translations)
      setIsLoaded(true)
    }
    initLocale()
  }, [])

  // Update document direction and save preference
  useEffect(() => {
    if (!isLoaded) return
    
    const htmlElement = document.documentElement
    
    if (isRtl) {
      htmlElement.setAttribute('dir', 'rtl')
      htmlElement.setAttribute('lang', locale)
    } else {
      htmlElement.setAttribute('dir', 'ltr')
      htmlElement.setAttribute('lang', locale)
    }

    localStorage.setItem('locale', locale)
  }, [locale, isRtl, isLoaded])

  const setLocale = (newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale)
      setIsRtl(newLocale === 'ar')
      
      loadTranslations(newLocale).then(trans => {
        setTranslations(trans as Translations)
      })
    }
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, translations, isRtl }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export function useTranslations() {
  const { translations } = useLanguage()
  return (key: string) => {
    const keys = key.split('.')
    let value: Translations | string | Record<string, string> = translations

    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k] as Translations | string | Record<string, string>
      } else {
        return key
      }
    }

    return typeof value === 'string' ? value : key
  }
}
