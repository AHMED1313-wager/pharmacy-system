import React from 'react';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

import AppRoutes from './AppRoutes';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          {/* فقط استخدم AppRoutes بدون Router هنا */}
          <AppRoutes />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;