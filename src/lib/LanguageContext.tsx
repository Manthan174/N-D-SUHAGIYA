"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, LanguageCode, TranslationKey } from "./translations";
import { auth, db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}



const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    // Try to load from localStorage first for immediate render
    if (typeof window !== "undefined") {
      const cachedLang = localStorage.getItem("user_language") as LanguageCode;
      if (cachedLang && translations[cachedLang]) {
        setLanguageState(cachedLang);
      }
    }

    // Then subscribe to Firebase for real-time updates across tabs/devices
    let unsubscribeDb: () => void;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const userId = user?.uid || 'admin';
      const settingsRef = ref(db, `users/${userId}/settings/companyProfile/language`);
      
      if (unsubscribeDb) unsubscribeDb();
      
      unsubscribeDb = onValue(settingsRef, (snapshot) => {
        const dbLang = snapshot.val() as LanguageCode;
        if (dbLang && translations[dbLang]) {
          setLanguageState(dbLang);
          if (typeof window !== "undefined") {
            localStorage.setItem("user_language", dbLang);
          }
        }
      });
    });

    return () => {
      if (unsubscribeDb) unsubscribeDb();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_language", lang);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
