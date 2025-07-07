'use client';

import { appId } from '@/config';
import { megaethTestnet } from 'viem/chains';
import React, { createContext, useContext, useState, useEffect } from 'react';

import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme, lightModeConfig, darkModeConfig } from '@/themes';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/wagmi-config';

if (!appId) throw new Error('App ID is not defined');

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export function ContextProvider({ children }) {
  const [themeMode, setThemeMode] = useState('light');
  const [show3DEffects, setShow3DEffects] = useState(true);
  const queryClient = new QueryClient();

  // Initialiser le thème depuis localStorage ou système
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      setThemeMode(saved);
    } else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const mode = prefersDark ? 'dark' : 'light';
      setThemeMode(mode);
    }
  }, []);

  // Initialiser les effets 3D depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('show3DEffects');
    if (saved !== null) {
      setShow3DEffects(JSON.parse(saved));
    }
  }, []);

  // Synchroniser avec les classes Tailwind
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newMode);
      return newMode;
    });
  };

  const toggle3DEffects = () => {
    setShow3DEffects((prev) => {
      const newValue = !prev;
      localStorage.setItem('show3DEffects', JSON.stringify(newValue));
      return newValue;
    });
  };

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{
      themeMode,
      toggleTheme,
      show3DEffects,
      toggle3DEffects,
      setShow3DEffects
    }}>
      <StyledThemeProvider theme={theme}>
        <PrivyProvider
          appId={appId}
          config={
            {
              // Create embedded wallets for users who don't have a wallet
              defaultChain: megaethTestnet, // Use the first network as default
              supportedChains: [megaethTestnet],
              embeddedWallets: {
                ethereum: {
                  createOnLogin: 'users-without-wallets', // Create embedded wallets for all users
                }
              },
              ...(themeMode === 'dark' ? darkModeConfig : lightModeConfig),

            }}
        >
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
          </QueryClientProvider>
        </PrivyProvider>
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
}