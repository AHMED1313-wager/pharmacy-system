import React, { createContext, useState, useMemo, useEffect } from 'react';

export const ThemeContext = createContext();

const storedTheme = localStorage.getItem('darkMode') === 'true';

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(storedTheme || false);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(prev => !prev);

  const value = useMemo(() => ({ darkMode, toggleTheme }), [darkMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};