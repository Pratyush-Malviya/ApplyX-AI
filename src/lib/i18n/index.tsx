"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import en from "./en.json";
import hi from "./hi.json";

type Locale = "en" | "hi";
type TranslationDict = Record<string, any>;

const translations: Record<Locale, TranslationDict> = { en, hi };

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((current, key) => current?.[key], obj) ?? path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const t = useCallback(
    (key: string) => getNestedValue(translations[locale], key),
    [locale]
  );

  const toggleLang = useCallback(() => {
    setLocale((prev) => (prev === "en" ? "hi" : "en"));
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}