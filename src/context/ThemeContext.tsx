'use client';

import React, { createContext, useContext } from 'react';
import { ThemeMode } from '@/types';
import { useSettings } from './SettingsContext';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { effectiveTheme, toggleTheme, updateSetting } = useSettings();

  const setTheme = (mode: ThemeMode) => {
    updateSetting('theme', mode);
  };

  return (
    <ThemeContext.Provider value={{ theme: effectiveTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  return context;
};
