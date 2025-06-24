"use client";
import { useState, useEffect } from "react";
import {useLogin, usePrivy} from '@privy-io/react-auth';
import {useLoginWithEmail} from '@privy-io/react-auth';
import { useWallets, getEmbeddedConnectedWallet } from '@privy-io/react-auth'
import { initWalletClient, clearWalletClient } from '@/utils/walletClient';

function LogoutButton() {
  const { ready, authenticated, logout } = usePrivy();

  // Disable logout when Privy is not ready or the user is not authenticated
  const disableLogout = !ready || (ready && !authenticated);

  return (
    <button disabled={disableLogout} onClick={logout}>
      Log out
    </button>
  );
}

function LoginButton() {
    const { ready, authenticated} = usePrivy();
    const { login } = useLogin();
    // Disable login when Privy is not ready or the user is already authenticated
    const disableLogin = !ready || (ready && authenticated);

    return (
        <button disabled={disableLogin} onClick={() => login({
                        loginMethods: ['wallet'],
                        walletChainType: 'ethereum',
                        disableSignup: false
                    })}>
            Log in
        </button>
    );
}

const WalletButton = () => {

    const { ready, authenticated } = usePrivy();
    const { login } = useLogin();
    // Disable login when Privy is not ready or the user is already authenticated
    const disableLogin = !ready || (ready && !authenticated);
    const { wallets } = useWallets();
    const embeddedWallet = getEmbeddedConnectedWallet(wallets);

    useEffect(() => {
        if (embeddedWallet?.address) {
        initWalletClient(embeddedWallet);
        } else {
        clearWalletClient(); // si on se déconnecte ou change de compte
        }
    }, [embeddedWallet]);

    return (
        <div>
            <div>
            {authenticated ? (
                <LogoutButton />
            ) : (
                <LoginButton />
            )}
            </div>
        </div>
    );
};

export default WalletButton;
