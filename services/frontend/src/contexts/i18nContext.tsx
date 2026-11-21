import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import he from '../locales/he.json';

type Language = 'en' | 'fr' | 'de' | 'he';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Record<string, any>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translationMap: Record<Language, Record<string, any>> = {
  en,
  fr,
  de,
  he,
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'fr' || saved === 'de' || saved === 'he') {
      return saved;
    }
    return 'en';
  });

  const [translations, setTranslations] = useState<Record<string, any>>(translationMap[language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setTranslations(translationMap[lang]);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    setTranslations(translationMap[language]);
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
