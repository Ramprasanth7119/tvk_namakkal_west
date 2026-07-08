"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language } from "@/constants/translations";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always default to Tamil ('ta') for hydration compatibility with SSR
  const [lang, setLangState] = useState<Language>("ta");

  // Read saved preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tvk_pref_lang") as Language;
      if (saved === "ta" || saved === "en") {
        setLangState(saved);
      }
    } catch (e) {
      console.warn("localStorage not accessible:", e);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("tvk_pref_lang", newLang);
      document.cookie = `tvk_pref_lang=${newLang}; path=/; max-age=31536000`;
    } catch (e) {
      console.warn("Could not save language preference:", e);
    }
  };

  // Sync lang attribute to html element
  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = lang;
      // also ensure cookie is set on mount if missing
      if (!document.cookie.includes("tvk_pref_lang=")) {
        document.cookie = `tvk_pref_lang=${lang}; path=/; max-age=31536000`;
      }
    }
  }, [lang]);

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const langDict = translations[lang] || translations["ta"];
    let text = langDict[key];
    
    // Fallback to Tamil if translation is missing in English
    if (text === undefined) {
      text = translations["ta"][key];
    }
    
    // Fallback to key name if completely missing
    if (text === undefined) {
      return key;
    }

    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
