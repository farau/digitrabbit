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
  const queryClient = new QueryClient();

  // Initialiser le thème depuis localStorage ou système
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      setThemeMode(saved);
      //modal.setThemeMode(saved);
    } else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const mode = prefersDark ? 'dark' : 'light';
      setThemeMode(mode);
      //modal.setThemeMode(mode);
    }
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newMode);
      //modal.setThemeMode(newMode);
      return newMode;
    });
  };

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
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
                  createOnLogin: 'all-users', // Create embedded wallets for all users
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
