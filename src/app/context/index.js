'use client';

import { ethersAdapter, projectId, networks } from '@/config';
import { createAppKit } from '@reown/appkit/react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DefaultSIWX } from '@reown/appkit-siwx';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '@/themes';

if (!projectId) throw new Error('Project ID is not defined');

export const modal = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata: {
    title: 'Digit Rabbit',
    description: 'Explore the wonderful world of Digit Rabbit!',
    url: 'http://localhost:3000',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#000000',
  },
  features: { analytics: true },
  siwx: new DefaultSIWX(),
});

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export function ContextProvider({ children }) {
  const [themeMode, setThemeMode] = useState('light');

  // Initialiser le thème depuis localStorage ou système
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      setThemeMode(saved);
      modal.setThemeMode(saved);
    } else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const mode = prefersDark ? 'dark' : 'light';
      setThemeMode(mode);
      modal.setThemeMode(mode);
    }
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newMode);
      modal.setThemeMode(newMode);
      return newMode;
    });
  };

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
}
