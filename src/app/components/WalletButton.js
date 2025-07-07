"use client";
import { usePrivy, useWallets, getEmbeddedConnectedWallet, Captcha } from '@privy-io/react-auth'
import { useLogin, useLoginWithOAuth } from '@privy-io/react-auth';
import { useWalletClient } from '../hooks/useWalletClient';

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
    const { ready, authenticated } = usePrivy();
    const { login } = useLogin();
    // Disable login when Privy is not ready or the user is already authenticated
    const disableLogin = !ready || (ready && authenticated);

    const { state, loading, initOAuth } = useLoginWithOAuth();

    const handleLogin = async () => {
        try {
            // The user will be redirected to OAuth provider's login page
            await initOAuth({ provider: 'twitter' });
        } catch (err) {
            // Handle errors (network issues, validation errors, etc.)
            console.error(err);
        }
    };

    return (
        <>
            <button disabled={disableLogin} onClick={() => login({
                loginMethods: ['twitter'],
                walletChainType: 'ethereum',
                disableSignup: false
            })}>
                Log in
            </button>
            <Captcha />
        </>
    );
}


const WalletButton = () => {

    const { ready, authenticated } = usePrivy();
    // Disable login when Privy is not ready or the user is already authenticated
    const disableLogin = !ready || (ready && !authenticated);
    const { wallets } = useWallets();
    const embeddedWallet = getEmbeddedConnectedWallet(wallets);

    // ✅ The hook manages ready, authenticated ET embeddedWallet
    const { walletClient } = useWalletClient(embeddedWallet);

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
