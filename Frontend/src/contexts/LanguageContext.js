import React, { createContext, useState, useMemo, useEffect } from 'react';

export const LanguageContext = createContext();

const storedLang = localStorage.getItem('language') || 'ar';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(storedLang);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => setLanguage(prev => (prev === 'ar' ? 'en' : 'ar'));

  const value = useMemo(() => ({ language, toggleLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};