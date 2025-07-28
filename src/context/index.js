'use client';

import { appId, clientId } from '@/config';
import { megaethTestnet } from 'viem/chains';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme, lightModeConfig, darkModeConfig } from '@/themes';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/wagmi-config';
import { useWallets, usePrivy, getEmbeddedConnectedWallet } from '@privy-io/react-auth';

if (!appId) throw new Error('App ID is not defined');

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// Contexte pour le jeu
const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

// Service de validation de wallet
const WalletValidationService = {
  async validateWalletOwnership(walletAddress) {
    try {
      const response = await fetch('/api/validate-wallet', {
        method: 'POST',
        body: JSON.stringify({ walletAddress })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const result = await response.json();
      return result.isValid;
    } catch (error) {
      console.error('Wallet validation error:', error);
      return false;
    }
  },

};

// Composant GameProvider interne
function GameProvider({ children }) {
  const { user, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  // États du wallet
  const [embeddedWallet, setEmbeddedWallet] = useState(null);
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [isWalletValidated, setIsWalletValidated] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);


  // Fonction de validation du wallet
  const validateWallet = useCallback(async (wallet) => {

    if (!wallet || !user || !authenticated) return false;

    setIsValidating(true);
    setValidationError(null);
    try {
      const isValid = await WalletValidationService.validateWalletOwnership(
        wallet.address
      );

      if (isValid) {
        setIsWalletValidated(true);
        console.log('✅ Wallet validation successful');
      } else {
        setIsWalletValidated(false);
        setValidationError('Wallet ownership validation failed');
        console.error('❌ Wallet validation failed');
      }

      return isValid;
    } catch (error) {
      setIsWalletValidated(false);
      setValidationError(error.message);
      console.error('❌ Wallet validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [user, authenticated]);

  // Gestion de l'état du wallet et validation
  useEffect(() => {
    if (ready && authenticated && user && wallets) {
      const wallet = wallets.find(
        (w) => w.walletClientType === 'privy' && w.address
      );

      if (wallet) {
        setEmbeddedWallet(wallet);
        setIsWalletReady(true);
        // Déclencher la validation
        validateWallet(wallet);
      }
    } else if (ready && !user) {
      // Utilisateur non connecté mais Privy est prêt
      setIsWalletReady(true);
      setIsWalletValidated(false);
    }
  }, [ready, authenticated, user, wallets, validateWallet]);

  // Retourner toutes les propriétés à plat pour faciliter l'usage
  return (
    <GameContext.Provider value={{
      // États du wallet avec validation
      embeddedWallet: isWalletValidated ? embeddedWallet : null,
      isWalletValidated,
      isValidating,
      validationError,

      // Fonctions de validation
      validateWallet,

    }}>
      {children}
    </GameContext.Provider>
  );
}

export function ContextProvider({ children }) {
  const [themeMode, setThemeMode] = useState('light');
  const [show3DEffects, setShow3DEffects] = useState(true);

  // Variable qui gère la présence de la page d'introduction
  const [hasEntered, setHasEntered] = useState(false);

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
      setShow3DEffects,
      hasEntered,
      setHasEntered
    }}>
      <StyledThemeProvider theme={theme}>
        <PrivyProvider
          appId={appId}
          {...(clientId && { clientId })}
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
            <WagmiProvider config={wagmiConfig}>
              <GameProvider>
                {children}
              </GameProvider>
            </WagmiProvider>
          </QueryClientProvider>
        </PrivyProvider>
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
}